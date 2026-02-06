import { SourceFile } from './ast';
import { Diagnostic } from './diagnostics';
import { resolveVersion } from './versionRegistry';

export function computeVersionDiagnostics(sourceFile: SourceFile): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (!sourceFile.languageVersion || !sourceFile.languageVersionOperator) {
    return diagnostics;
  }

  // Find the pragma declaration for the range
  const pragmaDecl = sourceFile.declarations.find(
    (d) => d.kind === 'PragmaDeclaration' && d.name === 'language_version',
  );
  if (!pragmaDecl) return diagnostics;

  const resolved = resolveVersion(sourceFile.languageVersion, sourceFile.languageVersionOperator);

  if (!resolved) {
    diagnostics.push({
      message: `Unsupported language version '${sourceFile.languageVersion}'`,
      range: pragmaDecl.range,
      severity: 'warning',
      source: 'compact-lsp',
      code: 'unsupported-version',
    });
  } else if (resolved.fallback) {
    diagnostics.push({
      message: `Version ${sourceFile.languageVersion} not found in registry; using ${resolved.effectiveVersion} instead`,
      range: pragmaDecl.range,
      severity: 'information',
      source: 'compact-lsp',
      code: 'version-resolved',
    });
  }

  return diagnostics;
}
