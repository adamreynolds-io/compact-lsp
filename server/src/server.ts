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
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from './parser';
import { buildSymbolTable, Scope, Reference, SymbolKind } from './symbols';
import { getHoverInfo } from './hover';
import { computeDiagnostics } from './diagnostics';
import { getDefinition } from './definition';
import { findReferences } from './references';
import { getCompletions } from './completion';
import { ParseResult } from './ast';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Per-document state
const documentState = new Map<
  string,
  { parseResult: ParseResult; fileScope: Scope; references: Reference[]; source: string }
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
    },
  };
});

function analyzeDocument(uri: string, text: string): void {
  const parseResult = parse(text);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);
  documentState.set(uri, { parseResult, fileScope, references, source: text });

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
    state.source,
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
    state.source,
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
    state.source,
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

documents.listen(connection);
connection.listen();
