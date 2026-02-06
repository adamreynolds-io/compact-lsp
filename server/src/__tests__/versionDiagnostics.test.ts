import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { computeVersionDiagnostics } from '../versionDiagnostics';

describe('versionDiagnostics', () => {
  it('produces no diagnostics when no pragma is present', () => {
    const { sourceFile } = parse('circuit foo() : Field { return 1; }');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for a known exact version', () => {
    const { sourceFile } = parse('pragma language_version 0.14.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces unsupported-version warning for unknown exact version', () => {
    const { sourceFile } = parse('pragma language_version 99.99.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe('unsupported-version');
    expect(diags[0].severity).toBe('warning');
    expect(diags[0].message).toContain('99.99.0');
  });

  it('produces no diagnostics for >= version that matches exactly', () => {
    const { sourceFile } = parse('pragma language_version >= 0.14.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces version-resolved info diagnostic for >= version fallback', () => {
    const { sourceFile } = parse('pragma language_version >= 0.10.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe('version-resolved');
    expect(diags[0].severity).toBe('information');
    expect(diags[0].message).toContain('0.10.0');
    expect(diags[0].message).toContain('0.14.0');
  });

  it('produces unsupported-version warning for >= with no matching version', () => {
    const { sourceFile } = parse('pragma language_version >= 99.0.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe('unsupported-version');
    expect(diags[0].severity).toBe('warning');
  });

  it('produces no diagnostics for exact 0.19.0', () => {
    const { sourceFile } = parse('pragma language_version 0.19.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for exact 0.20.0', () => {
    const { sourceFile } = parse('pragma language_version 0.20.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for exact 0.21.0', () => {
    const { sourceFile } = parse('pragma language_version 0.21.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for >= 0.19.0', () => {
    const { sourceFile } = parse('pragma language_version >= 0.19.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for >= 0.20.0', () => {
    const { sourceFile } = parse('pragma language_version >= 0.20.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('produces no diagnostics for >= 0.21.0', () => {
    const { sourceFile } = parse('pragma language_version >= 0.21.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(0);
  });

  it('>= 0.15.0 falls back to 0.18.0 with version-resolved diagnostic', () => {
    const { sourceFile } = parse('pragma language_version >= 0.15.0;');
    const diags = computeVersionDiagnostics(sourceFile);
    expect(diags).toHaveLength(1);
    expect(diags[0].code).toBe('version-resolved');
    expect(diags[0].severity).toBe('information');
    expect(diags[0].message).toContain('0.15.0');
    expect(diags[0].message).toContain('0.18.0');
  });
});
