import { describe, it, expect } from 'vitest';
import { computeImportDiagnostics } from './importDiagnostics';
import { WorkspaceIndex } from './workspaceIndex';
import { fsPathToUri } from './moduleResolution';

describe('Import Diagnostics', () => {
  function makeUri(name: string): string {
    return fsPathToUri(`/project/src/${name}`);
  }

  it('reports unknown module', () => {
    const index = new WorkspaceIndex();
    const mainUri = makeUri('main.compact');
    index.addFile(mainUri, 'import { foo } from UnknownModule;');

    const entry = index.getFileEntry(mainUri)!;
    const diagnostics = computeImportDiagnostics(
      entry.parseResult.sourceFile,
      entry.fileScope,
      index,
      mainUri,
    );

    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain("Module 'UnknownModule' not found");
    expect(diagnostics[0].code).toBe('module-not-found');
  });

  it('reports unknown specifier from resolved module', () => {
    const index = new WorkspaceIndex();
    const mathUri = makeUri('math.compact');
    const mainUri = makeUri('main.compact');

    index.addFile(mathUri, 'module MathUtils { circuit helper() : Void { } }');
    index.addFile(mainUri, 'import { nonExported } from MathUtils;');

    const entry = index.getFileEntry(mainUri)!;
    const diagnostics = computeImportDiagnostics(
      entry.parseResult.sourceFile,
      entry.fileScope,
      index,
      mainUri,
    );

    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].message).toContain("does not export 'nonExported'");
    expect(diagnostics[0].code).toBe('specifier-not-exported');
  });

  it('reports no diagnostic for valid import', () => {
    const index = new WorkspaceIndex();
    const mathUri = makeUri('math.compact');
    const mainUri = makeUri('main.compact');

    index.addFile(mathUri, 'module MathUtils { export circuit add(x: Field) : Field { } }');
    index.addFile(mainUri, 'import { add } from MathUtils;');

    const entry = index.getFileEntry(mainUri)!;
    const diagnostics = computeImportDiagnostics(
      entry.parseResult.sourceFile,
      entry.fileScope,
      index,
      mainUri,
    );

    expect(diagnostics.length).toBe(0);
  });

  it('suppresses diagnostic for standard library modules', () => {
    const index = new WorkspaceIndex();
    const mainUri = makeUri('main.compact');
    index.addFile(mainUri, 'import { something } from CompactStandardLibrary;');

    const entry = index.getFileEntry(mainUri)!;
    const diagnostics = computeImportDiagnostics(
      entry.parseResult.sourceFile,
      entry.fileScope,
      index,
      mainUri,
    );

    expect(diagnostics.length).toBe(0);
  });
});
