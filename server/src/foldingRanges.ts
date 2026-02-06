import { FoldingRange, FoldingRangeKind } from 'vscode-languageserver/node';
import {
  SourceFile,
  Declaration,
  Statement,
  ModuleDefinition,
  CircuitDefinition,
  ConstructorDeclaration,
} from './ast';

export function getFoldingRanges(sourceFile: SourceFile): FoldingRange[] {
  const ranges: FoldingRange[] = [];
  collectImportGroupRanges(sourceFile.declarations, ranges);
  collectDeclarationRanges(sourceFile.declarations, ranges);
  return ranges;
}

function addRange(
  ranges: FoldingRange[],
  startLine: number,
  endLine: number,
  kind?: FoldingRangeKind,
): void {
  if (endLine > startLine) {
    ranges.push({ startLine, endLine, kind });
  }
}

function collectDeclarationRanges(declarations: Declaration[], ranges: FoldingRange[]): void {
  for (const decl of declarations) {
    switch (decl.kind) {
      case 'ModuleDefinition':
        addRange(ranges, decl.range.start.line, decl.range.end.line, FoldingRangeKind.Region);
        collectDeclarationRanges(decl.declarations, ranges);
        break;
      case 'CircuitDefinition':
        addRange(ranges, decl.range.start.line, decl.range.end.line, FoldingRangeKind.Region);
        collectStatementRanges(decl.body, ranges);
        break;
      case 'ConstructorDeclaration':
        addRange(ranges, decl.range.start.line, decl.range.end.line, FoldingRangeKind.Region);
        collectStatementRanges(decl.body, ranges);
        break;
      case 'StructDefinition':
      case 'EnumDefinition':
      case 'ContractDeclaration':
        addRange(ranges, decl.range.start.line, decl.range.end.line, FoldingRangeKind.Region);
        break;
    }
  }
}

function collectStatementRanges(statements: Statement[], ranges: FoldingRange[]): void {
  for (const stmt of statements) {
    switch (stmt.kind) {
      case 'ForStatement':
        addRange(ranges, stmt.range.start.line, stmt.range.end.line, FoldingRangeKind.Region);
        collectStatementRanges(stmt.body, ranges);
        break;
      case 'IfStatement':
        addRange(ranges, stmt.range.start.line, stmt.range.end.line, FoldingRangeKind.Region);
        collectStatementRanges(stmt.consequent, ranges);
        if (stmt.alternate) {
          collectStatementRanges(stmt.alternate, ranges);
        }
        break;
      case 'BlockStatement':
        addRange(ranges, stmt.range.start.line, stmt.range.end.line, FoldingRangeKind.Region);
        collectStatementRanges(stmt.statements, ranges);
        break;
    }
  }
}

function collectImportGroupRanges(declarations: Declaration[], ranges: FoldingRange[]): void {
  let groupStart = -1;
  let groupEnd = -1;

  for (const decl of declarations) {
    if (decl.kind === 'ImportDeclaration') {
      if (groupStart === -1) {
        groupStart = decl.range.start.line;
      }
      groupEnd = decl.range.end.line;
    } else {
      if (groupStart !== -1 && groupEnd > groupStart) {
        addRange(ranges, groupStart, groupEnd, FoldingRangeKind.Imports);
      }
      groupStart = -1;
      groupEnd = -1;
    }
  }

  // Flush trailing group
  if (groupStart !== -1 && groupEnd > groupStart) {
    addRange(ranges, groupStart, groupEnd, FoldingRangeKind.Imports);
  }
}
