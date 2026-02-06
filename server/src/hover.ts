import { Token, TokenKind } from './lexer';
import { SourceRange } from './ast';
import { Scope, resolveSymbol, formatSignature } from './symbols';
import { ParseResult } from './ast';
import { findTokenAtPosition, findScopeForPosition } from './utils';
import { WorkspaceIndex } from './workspaceIndex';
import { resolveVersion } from './versionRegistry';

export interface HoverResult {
  contents: string;
  range: SourceRange;
  documentation?: string;
}

export function getHoverInfo(
  parseResult: ParseResult,
  fileScope: Scope,
  line: number,
  column: number,
  tokens: Token[],
  workspaceIndex?: WorkspaceIndex,
): HoverResult | undefined {
  // Check if cursor is on a pragma language_version declaration
  const pragmaHover = getPragmaVersionHover(parseResult, line, column);
  if (pragmaHover) return pragmaHover;

  // Find the token at position
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return undefined;

  // Only hover on identifiers and type keywords
  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return undefined;
  }

  // Try to find the symbol this identifier refers to
  // First, determine the scope for this position
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return undefined;

  const tokenRange: SourceRange = {
    start: token.pos,
    end: {
      line: token.pos.line,
      column: token.pos.column + token.text.length,
      offset: token.pos.offset + token.text.length,
    },
  };

  // Cross-file: if the symbol has a resolved URI, show the source symbol's signature
  if (symbol.resolvedUri && symbol.resolvedName && workspaceIndex) {
    const targetEntry = workspaceIndex.getFileEntry(symbol.resolvedUri);
    if (targetEntry) {
      const targetSym = targetEntry.exports.get(symbol.resolvedName);
      if (targetSym) {
        return {
          contents: formatSignature(targetSym),
          range: tokenRange,
          documentation: targetSym.documentation,
        };
      }
    }
    // Unresolvable import — show import info
    return {
      contents: `import ${symbol.name} from ${symbol.resolvedName} (unresolved)`,
      range: tokenRange,
    };
  }

  const signature = formatSignature(symbol);

  return {
    contents: signature,
    range: tokenRange,
    documentation: symbol.documentation,
  };
}

function getPragmaVersionHover(
  parseResult: ParseResult,
  line: number,
  column: number,
): HoverResult | undefined {
  const sf = parseResult.sourceFile;
  for (const decl of sf.declarations) {
    if (decl.kind !== 'PragmaDeclaration' || decl.name !== 'language_version') continue;

    // Check if cursor is within the pragma declaration range
    const r = decl.range;
    if (line < r.start.line || line > r.end.line) continue;
    if (line === r.start.line && column < r.start.column) continue;
    if (line === r.end.line && column > r.end.column) continue;

    const version = sf.languageVersion;
    const operator = sf.languageVersionOperator;
    if (!version || !operator) continue;

    const resolved = resolveVersion(version, operator);

    let contents: string;
    if (!resolved) {
      contents = `pragma language_version ${operator === '>=' ? '>= ' : ''}${version} (unsupported)`;
    } else if (resolved.fallback) {
      contents = `pragma language_version >= ${version} (using ${resolved.effectiveVersion})`;
    } else {
      contents = `pragma language_version ${operator === '>=' ? '>= ' : ''}${version} (supported)`;
    }

    return {
      contents,
      range: decl.range,
    };
  }
  return undefined;
}
