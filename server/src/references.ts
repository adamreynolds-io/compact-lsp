import { Token, TokenKind } from './lexer';
import { SourceRange, ParseResult } from './ast';
import { Scope, resolveSymbol, Reference } from './symbols';
import { findTokenAtPosition, findScopeForPosition } from './utils';
import { WorkspaceIndex } from './workspaceIndex';

export interface ReferenceResult {
  range: SourceRange;
  uri?: string;
}

export function findReferences(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  line: number,
  column: number,
  tokens: Token[],
  includeDeclaration: boolean,
  workspaceIndex?: WorkspaceIndex,
  currentFileUri?: string,
): ReferenceResult[] {
  // Find the token at position
  const token = findTokenAtPosition(tokens, line, column);
  if (!token) return [];

  // Only handle identifiers and type keywords
  if (token.kind !== TokenKind.Identifier && token.kind !== TokenKind.TypeKeyword) {
    return [];
  }

  // Determine the scope for this position
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);

  // Resolve the symbol under cursor to its declaration
  const symbol = resolveSymbol(token.text, scope);
  if (!symbol) return [];

  const result: ReferenceResult[] = [];

  // Optionally include the declaration itself
  if (includeDeclaration && symbol.declaration !== undefined) {
    result.push({ range: symbol.range });
  }

  // Scan references in current file
  for (const ref of references) {
    if (ref.name !== symbol.name) continue;

    const resolved = resolveSymbol(ref.name, ref.scope);
    if (resolved === symbol) {
      result.push({ range: ref.range });
    }
  }

  // Cross-file references
  if (workspaceIndex && currentFileUri) {
    // Determine the "canonical" symbol we're looking for
    let canonicalUri = currentFileUri;
    let canonicalName = symbol.name;

    if (symbol.resolvedUri && symbol.resolvedName) {
      // We're looking at an imported symbol — follow to source
      canonicalUri = symbol.resolvedUri;
      canonicalName = symbol.resolvedName;
    }

    // Check if this symbol is exported from its file
    const canonicalEntry = workspaceIndex.getFileEntry(canonicalUri);
    if (canonicalEntry && canonicalEntry.exports.has(canonicalName)) {
      // Search all other indexed files for references to this exported symbol
      for (const [fileUri, entry] of workspaceIndex.files) {
        if (fileUri === currentFileUri) continue;

        // Check if the file imports this symbol
        for (const [localName, sym] of entry.fileScope.symbols) {
          if (sym.resolvedUri === canonicalUri && sym.resolvedName === canonicalName) {
            // The import specifier itself is a reference
            result.push({ range: sym.range, uri: fileUri });

            // Also find body references in that file that resolve to this imported symbol
            for (const ref of entry.references) {
              if (ref.name !== localName) continue;
              const resolved = resolveSymbol(ref.name, ref.scope);
              if (resolved === sym) {
                result.push({ range: ref.range, uri: fileUri });
              }
            }
          }
        }
      }

      // If we followed an import to source, also include source file references
      if (canonicalUri !== currentFileUri && canonicalEntry) {
        const srcSymbol = canonicalEntry.exports.get(canonicalName);
        if (srcSymbol) {
          if (includeDeclaration) {
            result.push({ range: srcSymbol.range, uri: canonicalUri });
          }
          for (const ref of canonicalEntry.references) {
            if (ref.name !== canonicalName) continue;
            const resolved = resolveSymbol(ref.name, ref.scope);
            if (resolved === srcSymbol) {
              result.push({ range: ref.range, uri: canonicalUri });
            }
          }
        }
      }
    }
  }

  return result;
}
