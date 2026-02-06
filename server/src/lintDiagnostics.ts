import { SourceFile, Declaration, Statement } from './ast';
import { Scope, Reference, resolveSymbol } from './symbols';
import { Diagnostic } from './diagnostics';

export function computeLintDiagnostics(
  sourceFile: SourceFile,
  fileScope: Scope,
  references: Reference[],
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  checkUnusedImports(sourceFile, references, diagnostics);
  checkUnusedVariables(fileScope, references, diagnostics);
  checkUnusedParameters(sourceFile, fileScope, references, diagnostics);
  checkUnreachableCode(sourceFile, diagnostics);

  return diagnostics;
}

function isReferenced(name: string, references: Reference[]): boolean {
  return references.some((ref) => ref.name === name);
}

function checkUnusedImports(
  sourceFile: SourceFile,
  references: Reference[],
  diagnostics: Diagnostic[],
): void {
  for (const decl of sourceFile.declarations) {
    if (decl.kind !== 'ImportDeclaration' || !decl.specifiers) continue;

    for (const spec of decl.specifiers) {
      const localName = spec.alias || spec.name;
      if (!isReferenced(localName, references)) {
        diagnostics.push({
          message: `'${localName}' is imported but never used`,
          range: spec.range,
          severity: 'warning',
          source: 'compact-lsp',
          code: 'unused-import',
        });
      }
    }
  }
}

function checkUnusedVariables(
  fileScope: Scope,
  references: Reference[],
  diagnostics: Diagnostic[],
): void {
  walkScopeForUnusedConsts(fileScope, references, diagnostics);
}

function walkScopeForUnusedConsts(
  scope: Scope,
  references: Reference[],
  diagnostics: Diagnostic[],
): void {
  for (const [, symbol] of scope.symbols) {
    if (symbol.kind !== 'const') continue;
    if (symbol.name === '_') continue;

    if (!isReferenced(symbol.name, references)) {
      diagnostics.push({
        message: `'${symbol.name}' is declared but never used`,
        range: symbol.range,
        severity: 'warning',
        source: 'compact-lsp',
        code: 'unused-variable',
      });
    }
  }

  for (const child of scope.children) {
    walkScopeForUnusedConsts(child, references, diagnostics);
  }
}

function checkUnusedParameters(
  sourceFile: SourceFile,
  fileScope: Scope,
  references: Reference[],
  diagnostics: Diagnostic[],
): void {
  walkDeclarationsForUnusedParams(sourceFile.declarations, fileScope, references, diagnostics);
}

function walkDeclarationsForUnusedParams(
  declarations: Declaration[],
  scope: Scope,
  references: Reference[],
  diagnostics: Diagnostic[],
): void {
  for (const decl of declarations) {
    if (decl.kind === 'CircuitDefinition') {
      // Find the circuit's child scope
      const circuitScope = scope.children.find((c) => c.name === decl.name);
      if (!circuitScope) continue;

      for (const param of decl.params) {
        if (param.name === '_') continue;

        if (!isReferenced(param.name, references)) {
          diagnostics.push({
            message: `'${param.name}' is declared but never used`,
            range: param.range,
            severity: 'warning',
            source: 'compact-lsp',
            code: 'unused-parameter',
          });
        }
      }
    } else if (decl.kind === 'ModuleDefinition') {
      const moduleScope = scope.children.find((c) => c.name === decl.name);
      if (moduleScope) {
        walkDeclarationsForUnusedParams(decl.declarations, moduleScope, references, diagnostics);
      }
    }
    // Skip WitnessDeclaration — witness bodies are external
  }
}

function checkUnreachableCode(sourceFile: SourceFile, diagnostics: Diagnostic[]): void {
  for (const decl of sourceFile.declarations) {
    if (decl.kind === 'CircuitDefinition' || decl.kind === 'ConstructorDeclaration') {
      checkStatementsForUnreachable(decl.body, diagnostics);
    } else if (decl.kind === 'ModuleDefinition') {
      checkDeclarationsForUnreachable(decl.declarations, diagnostics);
    }
  }
}

function checkDeclarationsForUnreachable(
  declarations: Declaration[],
  diagnostics: Diagnostic[],
): void {
  for (const decl of declarations) {
    if (decl.kind === 'CircuitDefinition' || decl.kind === 'ConstructorDeclaration') {
      checkStatementsForUnreachable(decl.body, diagnostics);
    } else if (decl.kind === 'ModuleDefinition') {
      checkDeclarationsForUnreachable(decl.declarations, diagnostics);
    }
  }
}

function checkStatementsForUnreachable(
  stmts: Statement[],
  diagnostics: Diagnostic[],
): void {
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i];

    if (stmt.kind === 'ReturnStatement' && i < stmts.length - 1) {
      // All statements after the return are unreachable
      const firstUnreachable = stmts[i + 1];
      const lastUnreachable = stmts[stmts.length - 1];

      diagnostics.push({
        message: 'Unreachable code after return statement',
        range: {
          start: firstUnreachable.range.start,
          end: lastUnreachable.range.end,
        },
        severity: 'warning',
        source: 'compact-lsp',
        code: 'unreachable-code',
      });
      break; // Only one diagnostic per block
    }

    // Recurse into nested blocks
    if (stmt.kind === 'IfStatement') {
      checkStatementsForUnreachable(stmt.consequent, diagnostics);
      if (stmt.alternate) {
        checkStatementsForUnreachable(stmt.alternate, diagnostics);
      }
    } else if (stmt.kind === 'ForStatement') {
      checkStatementsForUnreachable(stmt.body, diagnostics);
    } else if (stmt.kind === 'BlockStatement') {
      checkStatementsForUnreachable(stmt.statements, diagnostics);
    }
  }
}
