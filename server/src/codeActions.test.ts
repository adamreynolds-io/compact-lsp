import { describe, it, expect } from 'vitest';
import { parse } from './parser';
import { buildSymbolTable } from './symbols';
import { tokenize } from './lexer';
import { computeDiagnostics } from './diagnostics';
import { computeImportDiagnostics } from './importDiagnostics';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';
import { getCodeActions, CodeActionResult } from './codeActions';
import { SourceRange } from './ast';

function makeUri(name: string): string {
  return fsPathToUri(`/project/src/${name}`);
}

function pointRange(line: number, column: number): SourceRange {
  return {
    start: { line, column, offset: 0 },
    end: { line, column, offset: 0 },
  };
}

function selectionRange(
  startLine: number,
  startCol: number,
  endLine: number,
  endCol: number,
): SourceRange {
  return {
    start: { line: startLine, column: startCol, offset: 0 },
    end: { line: endLine, column: endCol, offset: 0 },
  };
}

function getActionsForSource(
  source: string,
  range: SourceRange,
  workspaceIndex?: WorkspaceIndex,
  uri?: string,
): CodeActionResult[] {
  const tokens = tokenize(source);
  const parseResult = parse(source);
  const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

  const diagnostics = computeDiagnostics(parseResult.errors, references, fileScope);
  if (workspaceIndex && uri) {
    const importDiags = computeImportDiagnostics(
      parseResult.sourceFile,
      fileScope,
      workspaceIndex,
      uri,
    );
    diagnostics.push(...importDiags);
  }

  // Filter diagnostics that overlap with the range
  const relevantDiags = diagnostics.filter(
    (d) =>
      d.range.start.line <= range.end.line &&
      d.range.end.line >= range.start.line,
  );

  return getCodeActions(
    parseResult,
    fileScope,
    references,
    tokens,
    relevantDiags,
    range,
    source,
    workspaceIndex,
  );
}

describe('Code Actions', () => {
  describe('fix undefined reference — add import', () => {
    it('offers add import when workspace module exports the symbol', () => {
      const index = new WorkspaceIndex();
      const utilsUri = makeUri('utils.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(utilsUri, 'module Utils { export circuit helper() : Void { } }');
      index.addFile(mainUri, 'circuit foo() : Void {\n  helper;\n}');

      const source = 'circuit foo() : Void {\n  helper;\n}';
      const actions = getActionsForSource(source, pointRange(1, 2), index, mainUri);

      const addImport = actions.find((a) => a.title.includes("Add import of 'helper'"));
      expect(addImport).toBeDefined();
      expect(addImport!.kind).toBe('quickfix');
      expect(addImport!.edits[0].newText).toContain('import { helper } from Utils;');
    });

    it('offers multiple actions when multiple modules export the symbol', () => {
      const index = new WorkspaceIndex();
      const aUri = makeUri('a.compact');
      const bUri = makeUri('b.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(aUri, 'module ModA { export circuit helper() : Void { } }');
      index.addFile(bUri, 'module ModB { export circuit helper() : Void { } }');
      index.addFile(mainUri, 'circuit foo() : Void {\n  helper;\n}');

      const source = 'circuit foo() : Void {\n  helper;\n}';
      const actions = getActionsForSource(source, pointRange(1, 2), index, mainUri);

      const addImports = actions.filter((a) => a.title.includes("Add import of 'helper'"));
      expect(addImports.length).toBe(2);
      const titles = addImports.map((a) => a.title);
      expect(titles).toContain("Add import of 'helper' from ModA");
      expect(titles).toContain("Add import of 'helper' from ModB");
    });

    it('offers no action when no module exports the symbol', () => {
      const index = new WorkspaceIndex();
      const mainUri = makeUri('main.compact');

      index.addFile(mainUri, 'circuit foo() : Void {\n  unknown;\n}');

      const source = 'circuit foo() : Void {\n  unknown;\n}';
      const actions = getActionsForSource(source, pointRange(1, 2), index, mainUri);

      const addImport = actions.find((a) => a.title.includes('Add import'));
      expect(addImport).toBeUndefined();
    });
  });

  describe('fix specifier not exported', () => {
    it('removes single specifier from multi-specifier import', () => {
      const index = new WorkspaceIndex();
      const utilsUri = makeUri('utils.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(
        utilsUri,
        'module Utils { export circuit valid() : Void { } }',
      );
      index.addFile(mainUri, 'import { valid, invalid } from Utils;');

      const entry = index.getFileEntry(mainUri)!;
      const importDiags = computeImportDiagnostics(
        entry.parseResult.sourceFile,
        entry.fileScope,
        index,
        mainUri,
      );

      const specDiag = importDiags.find((d) => d.code === 'specifier-not-exported');
      expect(specDiag).toBeDefined();

      const source = 'import { valid, invalid } from Utils;';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      const actions = getCodeActions(
        parseResult,
        fileScope,
        references,
        tokens,
        [specDiag!],
        pointRange(specDiag!.range.start.line, specDiag!.range.start.column),
        source,
        index,
      );

      const removeAction = actions.find((a) => a.title.includes("Remove 'invalid'"));
      expect(removeAction).toBeDefined();
      expect(removeAction!.kind).toBe('quickfix');
      expect(removeAction!.edits[0].newText).toContain('import { valid } from Utils;');
    });

    it('removes entire import when only specifier is invalid', () => {
      const index = new WorkspaceIndex();
      const utilsUri = makeUri('utils.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(utilsUri, 'module Utils { export circuit other() : Void { } }');
      index.addFile(mainUri, 'import { invalid } from Utils;');

      const entry = index.getFileEntry(mainUri)!;
      const importDiags = computeImportDiagnostics(
        entry.parseResult.sourceFile,
        entry.fileScope,
        index,
        mainUri,
      );

      const specDiag = importDiags.find((d) => d.code === 'specifier-not-exported');
      expect(specDiag).toBeDefined();

      const source = 'import { invalid } from Utils;';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      const actions = getCodeActions(
        parseResult,
        fileScope,
        references,
        tokens,
        [specDiag!],
        pointRange(specDiag!.range.start.line, specDiag!.range.start.column),
        source,
        index,
      );

      const removeAction = actions.find((a) => a.title.includes('Remove import'));
      expect(removeAction).toBeDefined();
      expect(removeAction!.edits[0].newText).toBe('');
    });
  });

  describe('suggest similar module name', () => {
    it('offers did-you-mean for typo in module name', () => {
      const index = new WorkspaceIndex();
      const utilsUri = makeUri('utils.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(utilsUri, 'module Utils { export circuit foo() : Void { } }');
      index.addFile(mainUri, 'import { foo } from Utlis;');

      const entry = index.getFileEntry(mainUri)!;
      const importDiags = computeImportDiagnostics(
        entry.parseResult.sourceFile,
        entry.fileScope,
        index,
        mainUri,
      );

      const modDiag = importDiags.find((d) => d.code === 'module-not-found');
      expect(modDiag).toBeDefined();

      const source = 'import { foo } from Utlis;';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      const actions = getCodeActions(
        parseResult,
        fileScope,
        references,
        tokens,
        [modDiag!],
        pointRange(0, 0),
        source,
        index,
      );

      const suggestion = actions.find((a) => a.title.includes("Did you mean 'Utils'"));
      expect(suggestion).toBeDefined();
      expect(suggestion!.kind).toBe('quickfix');
      expect(suggestion!.edits[0].newText).toBe('Utils');
    });

    it('offers no action when no similar module exists', () => {
      const index = new WorkspaceIndex();
      const mainUri = makeUri('main.compact');

      index.addFile(mainUri, 'import { foo } from CompletelyWrong;');

      const entry = index.getFileEntry(mainUri)!;
      const importDiags = computeImportDiagnostics(
        entry.parseResult.sourceFile,
        entry.fileScope,
        index,
        mainUri,
      );

      const modDiag = importDiags.find((d) => d.code === 'module-not-found');
      expect(modDiag).toBeDefined();

      const source = 'import { foo } from CompletelyWrong;';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      const actions = getCodeActions(
        parseResult,
        fileScope,
        references,
        tokens,
        [modDiag!],
        pointRange(0, 0),
        source,
        index,
      );

      const suggestion = actions.find((a) => a.title.includes('Did you mean'));
      expect(suggestion).toBeUndefined();
    });
  });

  describe('extract to const', () => {
    it('offers extract action for valid expression selection', () => {
      const source = 'circuit foo(a: Field, b: Field) : Field {\n  return a + b;\n}';
      const actions = getActionsForSource(
        source,
        selectionRange(1, 9, 1, 14), // selects "a + b"
      );

      const extract = actions.find((a) => a.title === 'Extract to const');
      expect(extract).toBeDefined();
      expect(extract!.kind).toBe('refactor');
      expect(extract!.edits.length).toBe(2);
      // First edit: insert const declaration
      expect(extract!.edits[0].newText).toContain('const extracted = a + b;');
      // Second edit: replace selection with variable name
      expect(extract!.edits[1].newText).toBe('extracted');
    });

    it('does not offer extract for empty selection (cursor)', () => {
      const source = 'circuit foo(a: Field) : Field {\n  return a;\n}';
      const actions = getActionsForSource(source, pointRange(1, 9));

      const extract = actions.find((a) => a.title === 'Extract to const');
      expect(extract).toBeUndefined();
    });

    it('does not offer extract for selection containing semicolons', () => {
      const source = 'circuit foo() : Void {\n  const x = 1; const y = 2;\n}';
      const actions = getActionsForSource(
        source,
        selectionRange(1, 2, 1, 28),
      );

      const extract = actions.find((a) => a.title === 'Extract to const');
      expect(extract).toBeUndefined();
    });
  });

  describe('remove unused import', () => {
    it('offers removal for unused specifier', () => {
      const source = 'import { unused } from SomeModule;\ncircuit foo() : Void { }';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      // Position cursor on the "unused" specifier
      const specifier = parseResult.sourceFile.declarations[0];
      expect(specifier.kind).toBe('ImportDeclaration');
      if (specifier.kind === 'ImportDeclaration' && specifier.specifiers) {
        const specRange = specifier.specifiers[0].range;
        const actions = getCodeActions(
          parseResult,
          fileScope,
          references,
          tokens,
          [],
          pointRange(specRange.start.line, specRange.start.column),
          source,
        );

        const removeAction = actions.find((a) => a.title.includes("Remove unused import 'unused'"));
        expect(removeAction).toBeDefined();
        expect(removeAction!.kind).toBe('refactor');
      }
    });

    it('does not offer removal for used specifier', () => {
      const source =
        'import { used } from SomeModule;\ncircuit foo() : Void {\n  used;\n}';
      const tokens = tokenize(source);
      const parseResult = parse(source);
      const { fileScope, references } = buildSymbolTable(parseResult.sourceFile);

      const specifier = parseResult.sourceFile.declarations[0];
      expect(specifier.kind).toBe('ImportDeclaration');
      if (specifier.kind === 'ImportDeclaration' && specifier.specifiers) {
        const specRange = specifier.specifiers[0].range;
        const actions = getCodeActions(
          parseResult,
          fileScope,
          references,
          tokens,
          [],
          pointRange(specRange.start.line, specRange.start.column),
          source,
        );

        const removeAction = actions.find((a) => a.title.includes('Remove unused import'));
        expect(removeAction).toBeUndefined();
      }
    });
  });

  describe('without workspace index', () => {
    it('skips import-related actions but still offers refactoring', () => {
      const source = 'circuit foo(a: Field, b: Field) : Field {\n  return a + b;\n}';
      // No workspace index passed — import actions should be skipped
      const actions = getActionsForSource(
        source,
        selectionRange(1, 9, 1, 14),
        undefined,
        undefined,
      );

      // Should still offer extract to const
      const extract = actions.find((a) => a.title === 'Extract to const');
      expect(extract).toBeDefined();

      // Should not offer any import-related actions
      const importAction = actions.find(
        (a) => a.title.includes('Add import') || a.title.includes('Did you mean'),
      );
      expect(importAction).toBeUndefined();
    });
  });
});
