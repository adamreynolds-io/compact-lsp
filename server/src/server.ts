import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity,
  Hover,
  MarkupKind,
  CompletionItem as LspCompletionItem,
  CompletionItemKind,
  Location,
  DocumentSymbol,
  SymbolKind as LspSymbolKind,
  TextEdit,
  WorkspaceEdit,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  SemanticTokensRequest,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Token, tokenize } from './lexer';
import { parse } from './parser';
import { buildSymbolTable, Scope, Reference, SymbolKind } from './symbols';
import { getHoverInfo } from './hover';
import { computeDiagnostics } from './diagnostics';
import { getDefinition } from './definition';
import { findReferences } from './references';
import { getCompletions } from './completion';
import { getDocumentSymbols, DocSymbolKind } from './documentSymbols';
import { prepareRename, getRenameEdits } from './rename';
import { getSignatureHelp } from './signatureHelp';
import {
  getSemanticTokens,
  encodeSemanticTokens,
  TOKEN_TYPES,
  TOKEN_MODIFIERS,
} from './semanticTokens';
import { ParseResult } from './ast';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Per-document state
const documentState = new Map<
  string,
  {
    parseResult: ParseResult;
    fileScope: Scope;
    references: Reference[];
    source: string;
    tokens: Token[];
  }
>();

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      completionProvider: {
        resolveProvider: false,
      },
      documentSymbolProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ','],
      },
      semanticTokensProvider: {
        legend: {
          tokenTypes: [...TOKEN_TYPES],
          tokenModifiers: [...TOKEN_MODIFIERS],
        },
        full: true,
      },
    },
  };
});

const MAX_FILE_SIZE = 1_000_000;

function analyzeDocument(uri: string, text: string): void {
  if (text.length >= MAX_FILE_SIZE) {
    documentState.delete(uri);
    connection.sendDiagnostics({
      uri,
      diagnostics: [
        {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
          severity: DiagnosticSeverity.Warning,
          source: 'compact-lsp',
          message: 'File too large for analysis. LSP features disabled.',
        },
      ],
    });
    return;
  }

  const tokens = tokenize(text);
  const parseResult = parse(text);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  documentState.set(uri, { parseResult, fileScope, references, source: text, tokens });

  const diagnostics = computeDiagnostics(parseResult.errors, references, fileScope);
  const lspDiagnostics: LspDiagnostic[] = diagnostics.map((d) => ({
    range: {
      start: { line: d.range.start.line, character: d.range.start.column },
      end: { line: d.range.end.line, character: d.range.end.column },
    },
    severity: d.severity === 'error' ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
    source: d.source,
    message: d.message,
  }));

  connection.sendDiagnostics({ uri, diagnostics: lspDiagnostics });
}

documents.onDidOpen((event) => {
  analyzeDocument(event.document.uri, event.document.getText());
});

documents.onDidChangeContent((event) => {
  analyzeDocument(event.document.uri, event.document.getText());
});

documents.onDidClose((event) => {
  documentState.delete(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

connection.onHover((params): Hover | undefined => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return undefined;

  const result = getHoverInfo(
    state.parseResult,
    state.fileScope,
    params.position.line,
    params.position.character,
    state.tokens,
  );

  if (!result) return undefined;

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: '```compact\n' + result.contents + '\n```',
    },
    range: {
      start: { line: result.range.start.line, character: result.range.start.column },
      end: { line: result.range.end.line, character: result.range.end.column },
    },
  };
});

connection.onDefinition((params): Location | undefined => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return undefined;

  const result = getDefinition(
    state.parseResult,
    state.fileScope,
    state.references,
    params.position.line,
    params.position.character,
    state.tokens,
  );

  if (!result) return undefined;

  return {
    uri: params.textDocument.uri,
    range: {
      start: { line: result.range.start.line, character: result.range.start.column },
      end: { line: result.range.end.line, character: result.range.end.column },
    },
  };
});

connection.onReferences((params): Location[] => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return [];

  const ranges = findReferences(
    state.parseResult,
    state.fileScope,
    state.references,
    params.position.line,
    params.position.character,
    state.tokens,
    params.context.includeDeclaration,
  );

  return ranges.map((r) => ({
    uri: params.textDocument.uri,
    range: {
      start: { line: r.start.line, character: r.start.column },
      end: { line: r.end.line, character: r.end.column },
    },
  }));
});

const symbolKindToCompletionKind: Record<SymbolKind, CompletionItemKind> = {
  circuit: CompletionItemKind.Function,
  ledger: CompletionItemKind.Variable,
  witness: CompletionItemKind.Function,
  struct: CompletionItemKind.Struct,
  enum: CompletionItemKind.Enum,
  module: CompletionItemKind.Module,
  const: CompletionItemKind.Constant,
  contract: CompletionItemKind.Interface,
  parameter: CompletionItemKind.Variable,
  type: CompletionItemKind.TypeParameter,
  'builtin-type': CompletionItemKind.TypeParameter,
  'builtin-function': CompletionItemKind.Function,
};

connection.onCompletion((params): LspCompletionItem[] => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return [];

  const items = getCompletions(
    state.parseResult,
    state.fileScope,
    params.position.line,
    params.position.character,
  );

  return items.map((item) => ({
    label: item.label,
    kind: symbolKindToCompletionKind[item.kind] ?? CompletionItemKind.Text,
    detail: item.detail,
  }));
});

const docSymbolKindToLsp: Record<DocSymbolKind, LspSymbolKind> = {
  [DocSymbolKind.Function]: LspSymbolKind.Function,
  [DocSymbolKind.Variable]: LspSymbolKind.Variable,
  [DocSymbolKind.Constant]: LspSymbolKind.Constant,
  [DocSymbolKind.Struct]: LspSymbolKind.Struct,
  [DocSymbolKind.Enum]: LspSymbolKind.Enum,
  [DocSymbolKind.Module]: LspSymbolKind.Module,
  [DocSymbolKind.Interface]: LspSymbolKind.Interface,
  [DocSymbolKind.Field]: LspSymbolKind.Field,
  [DocSymbolKind.EnumMember]: LspSymbolKind.EnumMember,
};

function toDocumentSymbol(sym: ReturnType<typeof getDocumentSymbols>[number]): DocumentSymbol {
  return {
    name: sym.name,
    detail: sym.detail,
    kind: docSymbolKindToLsp[sym.kind] ?? LspSymbolKind.Variable,
    range: {
      start: { line: sym.range.start.line, character: sym.range.start.column },
      end: { line: sym.range.end.line, character: sym.range.end.column },
    },
    selectionRange: {
      start: { line: sym.selectionRange.start.line, character: sym.selectionRange.start.column },
      end: { line: sym.selectionRange.end.line, character: sym.selectionRange.end.column },
    },
    children: sym.children.map(toDocumentSymbol),
  };
}

connection.onDocumentSymbol((params): DocumentSymbol[] => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return [];

  const symbols = getDocumentSymbols(state.parseResult.sourceFile);
  return symbols.map(toDocumentSymbol);
});

connection.onPrepareRename((params) => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return undefined;

  const result = prepareRename(
    state.parseResult,
    state.fileScope,
    state.references,
    params.position.line,
    params.position.character,
    state.tokens,
  );

  if (!result) return undefined;

  return {
    range: {
      start: { line: result.range.start.line, character: result.range.start.column },
      end: { line: result.range.end.line, character: result.range.end.column },
    },
    placeholder: result.placeholder,
  };
});

connection.onRenameRequest((params): WorkspaceEdit | undefined => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return undefined;

  const edits = getRenameEdits(
    state.parseResult,
    state.fileScope,
    state.references,
    params.position.line,
    params.position.character,
    state.tokens,
    params.newName,
  );

  if (edits.length === 0) return undefined;

  const textEdits: TextEdit[] = edits.map((e) => ({
    range: {
      start: { line: e.range.start.line, character: e.range.start.column },
      end: { line: e.range.end.line, character: e.range.end.column },
    },
    newText: e.newText,
  }));

  return {
    changes: {
      [params.textDocument.uri]: textEdits,
    },
  };
});

connection.onSignatureHelp((params): SignatureHelp | undefined => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return undefined;

  const result = getSignatureHelp(
    state.parseResult,
    state.fileScope,
    params.position.line,
    params.position.character,
    state.source,
    state.tokens,
  );

  if (!result) return undefined;

  const sigInfo: SignatureInformation = {
    label: result.label,
    parameters: result.parameters.map((p): ParameterInformation => ({ label: p.label })),
  };

  return {
    signatures: [sigInfo],
    activeSignature: 0,
    activeParameter: result.activeParameter,
  };
});

connection.onRequest(SemanticTokensRequest.type, (params) => {
  const state = documentState.get(params.textDocument.uri);
  if (!state) return { data: [] };

  const semTokens = getSemanticTokens(state.parseResult, state.fileScope, state.tokens);
  const data = encodeSemanticTokens(semTokens);

  return { data };
});

documents.listen(connection);
connection.listen();
