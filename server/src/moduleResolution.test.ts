import { describe, it, expect } from 'vitest';
import {
  resolveModuleName,
  resolveStringPath,
  WorkspaceFileInfo,
  fsPathToUri,
} from './moduleResolution';

describe('Module Resolution', () => {
  describe('resolveModuleName', () => {
    function makeFiles(
      entries: { uri: string; moduleName: string }[],
    ): Map<string, WorkspaceFileInfo> {
      const map = new Map<string, WorkspaceFileInfo>();
      for (const e of entries) {
        map.set(e.uri, { moduleName: e.moduleName, uri: e.uri });
      }
      return map;
    }

    it('matches explicit module declaration name', () => {
      const files = makeFiles([
        { uri: fsPathToUri('/project/src/math.compact'), moduleName: 'MathUtils' },
      ]);
      expect(resolveModuleName('MathUtils', files)).toBe(fsPathToUri('/project/src/math.compact'));
    });

    it('matches file stem when no module declaration matches', () => {
      const files = makeFiles([{ uri: fsPathToUri('/project/src/utils.compact'), moduleName: '' }]);
      expect(resolveModuleName('utils', files)).toBe(fsPathToUri('/project/src/utils.compact'));
    });

    it('module declaration takes priority over file stem', () => {
      const files = makeFiles([
        { uri: fsPathToUri('/project/src/helpers.compact'), moduleName: 'Helpers' },
        { uri: fsPathToUri('/project/src/Helpers.compact'), moduleName: '' },
      ]);
      // "Helpers" should match the explicit module declaration, not the file stem
      const result = resolveModuleName('Helpers', files);
      expect(result).toBe(fsPathToUri('/project/src/helpers.compact'));
    });

    it('returns undefined for no match', () => {
      const files = makeFiles([
        { uri: fsPathToUri('/project/src/math.compact'), moduleName: 'MathUtils' },
      ]);
      expect(resolveModuleName('NonExistent', files)).toBeUndefined();
    });
  });

  describe('resolveStringPath', () => {
    it('resolves relative path and appends .compact', () => {
      const importingUri = fsPathToUri('/project/src/main.compact');
      const result = resolveStringPath('utils/helpers', importingUri);
      expect(result).toBe(fsPathToUri('/project/src/utils/helpers.compact'));
    });

    it('does not double-append .compact extension', () => {
      const importingUri = fsPathToUri('/project/src/main.compact');
      const result = resolveStringPath('utils/helpers.compact', importingUri);
      expect(result).toBe(fsPathToUri('/project/src/utils/helpers.compact'));
    });

    it('normalizes the path', () => {
      const importingUri = fsPathToUri('/project/src/sub/main.compact');
      const result = resolveStringPath('../lib/utils', importingUri);
      expect(result).toBe(fsPathToUri('/project/src/lib/utils.compact'));
    });
  });
});
