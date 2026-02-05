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
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from './parser';
import { buildSymbolTable, Scope } from './symbols';
import { getHoverInfo } from './hover';
import { computeDiagnostics } from './diagnostics';
import { ParseResult } from './ast';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

// Per-document state
const documentState = new Map<
  string,
  { parseResult: ParseResult; fileScope: Scope; source: string }
>();

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
    },
  };
});

function analyzeDocument(uri: string, text: string): void {
  const parseResult = parse(text);
  const fileScope = buildSymbolTable(parseResult.sourceFile);
  documentState.set(uri, { parseResult, fileScope, source: text });

  const diagnostics = computeDiagnostics(parseResult.errors);
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

documents.listen(connection);
connection.listen();
