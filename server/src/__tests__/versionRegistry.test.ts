import { describe, it, expect } from 'vitest';
import {
  isKnownVersion,
  getVersionCapabilities,
  resolveVersion,
  getAllBuiltins,
  LANGUAGE_VERSIONS,
} from '../versionRegistry';

describe('versionRegistry', () => {
  describe('isKnownVersion', () => {
    it('returns true for a registered version', () => {
      expect(isKnownVersion('0.14.0')).toBe(true);
    });

    it('returns false for an unregistered version', () => {
      expect(isKnownVersion('99.0.0')).toBe(false);
    });
  });

  describe('getVersionCapabilities', () => {
    it('returns capabilities for a known version', () => {
      const caps = getVersionCapabilities('0.14.0');
      expect(caps).toBeDefined();
      expect(caps!.builtinTypes).toContain('Field');
      expect(caps!.builtinTypes).toContain('Boolean');
      expect(caps!.builtinFunctions).toContain('map');
      expect(caps!.builtinFunctions).toContain('fold');
      expect(caps!.builtinAdtTypes).toContain('Counter');
    });

    it('returns undefined for an unknown version', () => {
      expect(getVersionCapabilities('99.0.0')).toBeUndefined();
    });
  });

  describe('resolveVersion', () => {
    it('resolves exact match with = operator', () => {
      const result = resolveVersion('0.14.0', '=');
      expect(result).toEqual({ effectiveVersion: '0.14.0', fallback: false });
    });

    it('falls forward to latest for unknown version with = operator', () => {
      const result = resolveVersion('0.15.0', '=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.21.0');
      expect(result!.fallback).toBe(true);
    });

    it('resolves exact match with >= operator', () => {
      const result = resolveVersion('0.14.0', '>=');
      expect(result).toEqual({ effectiveVersion: '0.14.0', fallback: false });
    });

    it('falls back to next highest with >= operator', () => {
      const result = resolveVersion('0.10.0', '>=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.14.0');
      expect(result!.fallback).toBe(true);
    });

    it('returns undefined when no version >= requested exists', () => {
      expect(resolveVersion('99.0.0', '>=')).toBeUndefined();
    });
  });

  describe('registry data', () => {
    it('contains version 0.14.0', () => {
      expect(LANGUAGE_VERSIONS['0.14.0']).toBeDefined();
    });

    it('0.14.0 has all 7 built-in types', () => {
      const types = LANGUAGE_VERSIONS['0.14.0'].builtinTypes;
      expect(types).toEqual(['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']);
    });

    it('0.14.0 has built-in functions', () => {
      const funcs = LANGUAGE_VERSIONS['0.14.0'].builtinFunctions;
      expect(funcs).toContain('map');
      expect(funcs).toContain('fold');
      expect(funcs).toContain('disclose');
      expect(funcs.length).toBe(19);
    });

    it('0.14.0 has ADT types', () => {
      const adts = LANGUAGE_VERSIONS['0.14.0'].builtinAdtTypes;
      expect(adts).toContain('Counter');
      expect(adts).toContain('Set');
      expect(adts.length).toBe(8);
    });

    it('contains version 0.18.0', () => {
      expect(LANGUAGE_VERSIONS['0.18.0']).toBeDefined();
      expect(isKnownVersion('0.18.0')).toBe(true);
    });

    it('0.18.0 has all 0.14.0 built-in types', () => {
      const types = LANGUAGE_VERSIONS['0.18.0'].builtinTypes;
      expect(types).toEqual(['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']);
    });

    it('0.18.0 has 0.14.0 functions plus left, right, burnAddress', () => {
      const funcs = LANGUAGE_VERSIONS['0.18.0'].builtinFunctions;
      // All 0.14.0 functions
      expect(funcs).toContain('map');
      expect(funcs).toContain('fold');
      expect(funcs).toContain('disclose');
      // New in 0.18.0
      expect(funcs).toContain('left');
      expect(funcs).toContain('right');
      expect(funcs).toContain('burnAddress');
      expect(funcs.length).toBe(22);
    });

    it('0.18.0 has 0.14.0 ADTs plus Either, ZswapCoinPublicKey, ContractAddress, Maybe, CurvePoint', () => {
      const adts = LANGUAGE_VERSIONS['0.18.0'].builtinAdtTypes;
      // All 0.14.0 ADTs
      expect(adts).toContain('Counter');
      expect(adts).toContain('Set');
      // New in 0.18.0
      expect(adts).toContain('Either');
      expect(adts).toContain('ZswapCoinPublicKey');
      expect(adts).toContain('ContractAddress');
      expect(adts).toContain('Maybe');
      expect(adts).toContain('CurvePoint');
      expect(adts.length).toBe(13);
    });

    it('contains version 0.19.0', () => {
      expect(LANGUAGE_VERSIONS['0.19.0']).toBeDefined();
      expect(isKnownVersion('0.19.0')).toBe(true);
    });

    it('0.19.0 has all 0.14.0 built-in types', () => {
      const types = LANGUAGE_VERSIONS['0.19.0'].builtinTypes;
      expect(types).toEqual(['Field', 'Boolean', 'Uint', 'Bytes', 'Vector', 'Opaque', 'Void']);
    });

    it('0.19.0 has NativePoint in ADTs but not CurvePoint', () => {
      const adts = LANGUAGE_VERSIONS['0.19.0'].builtinAdtTypes;
      expect(adts).toContain('NativePoint');
      expect(adts).not.toContain('CurvePoint');
      expect(adts.length).toBe(13);
    });

    it('0.19.0 has NativePointX and NativePointY in functions', () => {
      const funcs = LANGUAGE_VERSIONS['0.19.0'].builtinFunctions;
      expect(funcs).toContain('NativePointX');
      expect(funcs).toContain('NativePointY');
      expect(funcs).toContain('left');
      expect(funcs).toContain('right');
      expect(funcs.length).toBe(24);
    });

    it('contains version 0.20.0', () => {
      expect(LANGUAGE_VERSIONS['0.20.0']).toBeDefined();
      expect(isKnownVersion('0.20.0')).toBe(true);
    });

    it('0.20.0 has nativePointX, nativePointY, constructNativePoint in functions', () => {
      const funcs = LANGUAGE_VERSIONS['0.20.0'].builtinFunctions;
      expect(funcs).toContain('nativePointX');
      expect(funcs).toContain('nativePointY');
      expect(funcs).toContain('constructNativePoint');
      expect(funcs).not.toContain('NativePointX');
      expect(funcs).not.toContain('NativePointY');
      expect(funcs.length).toBe(25);
    });

    it('0.20.0 has NativePoint in ADTs', () => {
      const adts = LANGUAGE_VERSIONS['0.20.0'].builtinAdtTypes;
      expect(adts).toContain('NativePoint');
      expect(adts.length).toBe(13);
    });

    it('contains version 0.21.0', () => {
      expect(LANGUAGE_VERSIONS['0.21.0']).toBeDefined();
      expect(isKnownVersion('0.21.0')).toBe(true);
    });

    it('0.21.0 has identical capabilities to 0.20.0', () => {
      const caps20 = LANGUAGE_VERSIONS['0.20.0'];
      const caps21 = LANGUAGE_VERSIONS['0.21.0'];
      expect(caps21.builtinTypes).toEqual(caps20.builtinTypes);
      expect(caps21.builtinFunctions).toEqual(caps20.builtinFunctions);
      expect(caps21.builtinAdtTypes).toEqual(caps20.builtinAdtTypes);
    });
  });

  describe('version resolution with 0.18.0', () => {
    it('>= 0.18.0 resolves exactly', () => {
      const result = resolveVersion('0.18.0', '>=');
      expect(result).toEqual({ effectiveVersion: '0.18.0', fallback: false });
    });

    it('>= 0.15.0 falls back to 0.18.0', () => {
      const result = resolveVersion('0.15.0', '>=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.18.0');
      expect(result!.fallback).toBe(true);
    });

    it('exact 0.18.0 resolves', () => {
      const result = resolveVersion('0.18.0', '=');
      expect(result).toEqual({ effectiveVersion: '0.18.0', fallback: false });
    });
  });

  describe('version resolution with 0.19.0–0.21.0', () => {
    it('>= 0.19.0 resolves exactly', () => {
      const result = resolveVersion('0.19.0', '>=');
      expect(result).toEqual({ effectiveVersion: '0.19.0', fallback: false });
    });

    it('>= 0.20.0 resolves exactly', () => {
      const result = resolveVersion('0.20.0', '>=');
      expect(result).toEqual({ effectiveVersion: '0.20.0', fallback: false });
    });

    it('>= 0.21.0 resolves exactly', () => {
      const result = resolveVersion('0.21.0', '>=');
      expect(result).toEqual({ effectiveVersion: '0.21.0', fallback: false });
    });

    it('>= 0.15.0 falls back to 0.18.0', () => {
      const result = resolveVersion('0.15.0', '>=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.18.0');
      expect(result!.fallback).toBe(true);
    });

    it('exact 0.19.0 resolves', () => {
      const result = resolveVersion('0.19.0', '=');
      expect(result).toEqual({ effectiveVersion: '0.19.0', fallback: false });
    });

    it('exact 0.20.0 resolves', () => {
      const result = resolveVersion('0.20.0', '=');
      expect(result).toEqual({ effectiveVersion: '0.20.0', fallback: false });
    });

    it('exact 0.21.0 resolves', () => {
      const result = resolveVersion('0.21.0', '=');
      expect(result).toEqual({ effectiveVersion: '0.21.0', fallback: false });
    });

    it('unknown exact version 0.22.0 falls forward to latest', () => {
      const result = resolveVersion('0.22.0', '=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.21.0');
      expect(result!.fallback).toBe(true);
    });

    it('unknown exact version 99.99.0 falls forward to latest', () => {
      const result = resolveVersion('99.99.0', '=');
      expect(result).toBeDefined();
      expect(result!.effectiveVersion).toBe('0.21.0');
      expect(result!.fallback).toBe(true);
    });
  });

  describe('getAllBuiltins', () => {
    it('includes both current and removed built-ins', () => {
      const all = getAllBuiltins();
      // CurvePoint (removed in 0.19.0) and NativePoint (added in 0.19.0)
      expect(all.builtinAdtTypes).toContain('CurvePoint');
      expect(all.builtinAdtTypes).toContain('NativePoint');
      // NativePointX (removed in 0.20.0) and nativePointX (added in 0.20.0)
      expect(all.builtinFunctions).toContain('NativePointX');
      expect(all.builtinFunctions).toContain('nativePointX');
    });

    it('includes all types from all versions', () => {
      const all = getAllBuiltins();
      expect(all.builtinTypes).toContain('Field');
      expect(all.builtinTypes).toContain('Boolean');
      expect(all.builtinTypes).toContain('Void');
    });
  });

  describe('delta-based capabilities match previous values', () => {
    it('0.14.0 has correct types', () => {
      expect(LANGUAGE_VERSIONS['0.14.0'].builtinTypes).toEqual([
        'Field',
        'Boolean',
        'Uint',
        'Bytes',
        'Vector',
        'Opaque',
        'Void',
      ]);
    });

    it('0.14.0 has correct functions', () => {
      expect(LANGUAGE_VERSIONS['0.14.0'].builtinFunctions).toEqual([
        'map',
        'fold',
        'disclose',
        'pad',
        'slice',
        'default',
        'transientHash',
        'transientCommit',
        'persistentHash',
        'persistentCommit',
        'degradeToTransient',
        'upgradeFromTransient',
        'ecAdd',
        'ecMul',
        'ecMulGenerator',
        'hashToCurve',
        'ownPublicKey',
        'createZswapInput',
        'createZswapOutput',
      ]);
    });

    it('0.14.0 has correct ADT types', () => {
      expect(LANGUAGE_VERSIONS['0.14.0'].builtinAdtTypes).toEqual([
        'Counter',
        'Set',
        'Map',
        'List',
        'MerkleTree',
        'HistoricMerkleTree',
        'Cell',
        'Kernel',
      ]);
    });

    it('0.18.0 adds functions and ADT types from 0.14.0', () => {
      const caps = LANGUAGE_VERSIONS['0.18.0'];
      expect(caps.builtinFunctions).toContain('left');
      expect(caps.builtinFunctions).toContain('right');
      expect(caps.builtinFunctions).toContain('burnAddress');
      expect(caps.builtinAdtTypes).toContain('CurvePoint');
      expect(caps.builtinAdtTypes).toContain('Either');
    });

    it('0.19.0 removes CurvePoint and adds NativePoint', () => {
      const caps = LANGUAGE_VERSIONS['0.19.0'];
      expect(caps.builtinAdtTypes).not.toContain('CurvePoint');
      expect(caps.builtinAdtTypes).toContain('NativePoint');
      expect(caps.builtinFunctions).toContain('NativePointX');
      expect(caps.builtinFunctions).toContain('NativePointY');
    });

    it('0.20.0 renames NativePointX/Y to lowercase and adds constructNativePoint', () => {
      const caps = LANGUAGE_VERSIONS['0.20.0'];
      expect(caps.builtinFunctions).not.toContain('NativePointX');
      expect(caps.builtinFunctions).not.toContain('NativePointY');
      expect(caps.builtinFunctions).toContain('nativePointX');
      expect(caps.builtinFunctions).toContain('nativePointY');
      expect(caps.builtinFunctions).toContain('constructNativePoint');
    });

    it('0.21.0 is identical to 0.20.0', () => {
      expect(LANGUAGE_VERSIONS['0.21.0'].builtinTypes).toEqual(
        LANGUAGE_VERSIONS['0.20.0'].builtinTypes,
      );
      expect(LANGUAGE_VERSIONS['0.21.0'].builtinFunctions).toEqual(
        LANGUAGE_VERSIONS['0.20.0'].builtinFunctions,
      );
      expect(LANGUAGE_VERSIONS['0.21.0'].builtinAdtTypes).toEqual(
        LANGUAGE_VERSIONS['0.20.0'].builtinAdtTypes,
      );
    });
  });
});
