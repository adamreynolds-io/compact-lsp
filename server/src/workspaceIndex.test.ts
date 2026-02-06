import { describe, it, expect } from 'vitest';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';

describe('WorkspaceIndex', () => {
  function makeUri(name: string): string {
    return fsPathToUri(`/project/src/${name}`);
  }

  describe('addFile / removeFile / updateFile', () => {
    it('adds a file and populates entry', () => {
      const index = new WorkspaceIndex();
      const uri = makeUri('math.compact');
      index.addFile(uri, 'export circuit add(x: Field, y: Field) : Field { }');

      const entry = index.getFileEntry(uri);
      expect(entry).toBeDefined();
      expect(entry!.moduleName).toBe('math');
      expect(entry!.exports.has('add')).toBe(true);
    });

    it('extracts module name from module declaration', () => {
      const index = new WorkspaceIndex();
      const uri = makeUri('math.compact');
      index.addFile(uri, 'module MathUtils { export circuit add(x: Field) : Field { } }');

      const entry = index.getFileEntry(uri);
      expect(entry!.moduleName).toBe('MathUtils');
    });

    it('removes a file', () => {
      const index = new WorkspaceIndex();
      const uri = makeUri('math.compact');
      index.addFile(uri, 'export circuit add(x: Field) : Field { }');
      expect(index.files.size).toBe(1);

      index.removeFile(uri);
      expect(index.files.size).toBe(0);
      expect(index.getFileEntry(uri)).toBeUndefined();
    });

    it('updates a file', () => {
      const index = new WorkspaceIndex();
      const uri = makeUri('math.compact');
      index.addFile(uri, 'export circuit add(x: Field) : Field { }');
      expect(index.getFileEntry(uri)!.exports.has('add')).toBe(true);

      index.updateFile(uri, 'export circuit sub(x: Field) : Field { }');
      expect(index.getFileEntry(uri)!.exports.has('add')).toBe(false);
      expect(index.getFileEntry(uri)!.exports.has('sub')).toBe(true);
    });
  });

  describe('resolveImport', () => {
    it('resolves selective import from identifier module', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(mathUri, 'module MathUtils { export circuit add(x: Field) : Field { } }');
      index.addFile(mainUri, 'import { add } from MathUtils;');

      const mainEntry = index.getFileEntry(mainUri)!;
      const importDecl = mainEntry.parseResult.sourceFile.declarations.find(
        (d) => d.kind === 'ImportDeclaration',
      )!;

      const resolved = index.resolveImport(
        importDecl as import('./ast').ImportDeclaration,
        mainUri,
      );
      expect(resolved.has('add')).toBe(true);
      expect(resolved.get('add')!.uri).toBe(mathUri);
    });

    it('resolves aliased import', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(mathUri, 'module MathUtils { export circuit add(x: Field) : Field { } }');
      index.addFile(mainUri, 'import { add as sum } from MathUtils;');

      const mainEntry = index.getFileEntry(mainUri)!;
      const importDecl = mainEntry.parseResult.sourceFile.declarations.find(
        (d) => d.kind === 'ImportDeclaration',
      )!;

      const resolved = index.resolveImport(
        importDecl as import('./ast').ImportDeclaration,
        mainUri,
      );
      expect(resolved.has('sum')).toBe(true);
      expect(resolved.get('sum')!.symbolInfo.name).toBe('add');
    });

    it('returns empty map for unresolvable module', () => {
      const index = new WorkspaceIndex();
      const mainUri = makeUri('main.compact');
      index.addFile(mainUri, 'import { foo } from UnknownModule;');

      const mainEntry = index.getFileEntry(mainUri)!;
      const importDecl = mainEntry.parseResult.sourceFile.declarations.find(
        (d) => d.kind === 'ImportDeclaration',
      )!;

      const resolved = index.resolveImport(
        importDecl as import('./ast').ImportDeclaration,
        mainUri,
      );
      expect(resolved.size).toBe(0);
    });

    it('returns empty for unresolvable specifier', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(mathUri, 'module MathUtils { circuit helper() : Void { } }');
      index.addFile(mainUri, 'import { nonExported } from MathUtils;');

      const mainEntry = index.getFileEntry(mainUri)!;
      const importDecl = mainEntry.parseResult.sourceFile.declarations.find(
        (d) => d.kind === 'ImportDeclaration',
      )!;

      const resolved = index.resolveImport(
        importDecl as import('./ast').ImportDeclaration,
        mainUri,
      );
      expect(resolved.size).toBe(0);
    });
  });

  describe('resolveFileImports', () => {
    it('patches resolvedUri and resolvedName on imported symbols', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(mathUri, 'module MathUtils { export circuit add(x: Field) : Field { } }');
      index.addFile(mainUri, 'import { add } from MathUtils;');

      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      const addSym = mainEntry.fileScope.symbols.get('add');
      expect(addSym).toBeDefined();
      expect(addSym!.resolvedUri).toBe(mathUri);
      expect(addSym!.resolvedName).toBe('add');
    });

    it('patches aliased import with original name', () => {
      const index = new WorkspaceIndex();
      const mathUri = makeUri('math.compact');
      const mainUri = makeUri('main.compact');

      index.addFile(mathUri, 'module MathUtils { export circuit add(x: Field) : Field { } }');
      index.addFile(mainUri, 'import { add as sum } from MathUtils;');

      index.resolveFileImports(mainUri);

      const mainEntry = index.getFileEntry(mainUri)!;
      const sumSym = mainEntry.fileScope.symbols.get('sum');
      expect(sumSym).toBeDefined();
      expect(sumSym!.resolvedUri).toBe(mathUri);
      expect(sumSym!.resolvedName).toBe('add');
    });
  });
});
