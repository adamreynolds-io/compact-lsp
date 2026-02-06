import { describe, it, expect } from 'vitest';
import {
  isKnownVersion,
  getVersionCapabilities,
  resolveVersion,
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

    it('returns undefined for unknown version with = operator', () => {
      expect(resolveVersion('0.15.0', '=')).toBeUndefined();
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
  });
});
