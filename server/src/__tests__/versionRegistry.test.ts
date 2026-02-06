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
  });
});
