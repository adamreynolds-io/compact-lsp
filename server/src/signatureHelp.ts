import { tokenize, TokenKind } from './lexer';
import { ParseResult, Parameter } from './ast';
import { Scope, SymbolInfo, resolveSymbol } from './symbols';
import { findScopeForPosition } from './utils';

export interface SignatureHelpResult {
  label: string;
  parameters: { label: string }[];
  activeParameter: number;
}

export function getSignatureHelp(
  parseResult: ParseResult,
  fileScope: Scope,
  line: number,
  column: number,
  source: string,
): SignatureHelpResult | undefined {
  // Find the enclosing call expression by scanning tokens for matching parens
  const callInfo = findEnclosingCall(source, line, column);
  if (!callInfo) return undefined;

  // Resolve the callee name to a symbol
  const scope = findScopeForPosition(fileScope, line, column, parseResult.sourceFile);
  const symbol = resolveSymbol(callInfo.calleeName, scope);
  if (!symbol) return undefined;

  // Get parameters from the declaration
  const params = getParametersFromSymbol(symbol);
  if (!params) return undefined;

  const paramStrings = params.map((p) => {
    if (p.typeAnnotation) {
      return `${p.name}: ${formatTypeNode(p.typeAnnotation)}`;
    }
    return p.name;
  });

  const label = formatSignatureLabel(symbol, paramStrings);

  return {
    label,
    parameters: paramStrings.map((s) => ({ label: s })),
    activeParameter: Math.min(callInfo.activeParam, Math.max(params.length - 1, 0)),
  };
}

interface CallInfo {
  calleeName: string;
  activeParam: number;
}

function findEnclosingCall(source: string, line: number, column: number): CallInfo | undefined {
  const tokens = tokenize(source);

  // Convert line/column to offset
  const targetOffset = lineColumnToOffset(source, line, column);
  if (targetOffset === undefined) return undefined;

  // Walk tokens to find the innermost open paren before cursor that isn't closed
  // Track a stack of open parens with their callee names
  const stack: { calleeName: string; parenOffset: number; commaCount: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind === TokenKind.EOF) break;

    const tokenStart = token.pos.offset;
    if (tokenStart >= targetOffset) break;

    if (token.kind === TokenKind.OpenParen) {
      // Look back for the callee name
      let calleeName = '';
      for (let j = i - 1; j >= 0; j--) {
        const prev = tokens[j];
        if (prev.kind === TokenKind.Identifier || prev.kind === TokenKind.TypeKeyword) {
          calleeName = prev.text;
          break;
        }
        // Skip over closing angle brackets for generics
        if (prev.kind === TokenKind.GreaterThan) continue;
        break;
      }
      stack.push({ calleeName, parenOffset: tokenStart, commaCount: 0 });
    } else if (token.kind === TokenKind.CloseParen) {
      if (stack.length > 0) {
        stack.pop();
      }
    } else if (token.kind === TokenKind.Comma) {
      if (stack.length > 0) {
        stack[stack.length - 1].commaCount++;
      }
    }
  }

  // Also check the token at cursor position (if it's a comma or open paren, it was just typed)
  // The cursor might be right after the open paren or comma
  if (stack.length === 0) return undefined;

  const top = stack[stack.length - 1];
  if (!top.calleeName) return undefined;

  return {
    calleeName: top.calleeName,
    activeParam: top.commaCount,
  };
}

function lineColumnToOffset(source: string, line: number, column: number): number | undefined {
  let currentLine = 0;
  let offset = 0;

  for (let i = 0; i < source.length; i++) {
    if (currentLine === line) {
      return offset + column;
    }
    if (source[i] === '\n') {
      currentLine++;
      offset = i + 1;
    }
  }

  if (currentLine === line) {
    return offset + column;
  }

  return undefined;
}

function getParametersFromSymbol(symbol: SymbolInfo): Parameter[] | undefined {
  const decl = symbol.declaration;
  if (!decl) {
    // Built-in function — no parameter info available
    if (symbol.kind === 'builtin-function') return [];
    return undefined;
  }

  switch (decl.kind) {
    case 'CircuitDefinition':
    case 'ExternalCircuit':
    case 'WitnessDeclaration':
      return decl.params;
    default:
      return undefined;
  }
}

import { TypeNode } from './ast';

function formatTypeNode(t: TypeNode): string {
  switch (t.kind) {
    case 'TypeReference':
      return t.name;
    case 'ParameterizedType':
      return `${t.name}<${t.args.map((a) => (a.kind === 'NumberArgument' ? a.value : formatTypeNode(a))).join(', ')}>`;
    case 'TupleType':
      return `[${t.elements.map(formatTypeNode).join(', ')}]`;
  }
}

function formatSignatureLabel(symbol: SymbolInfo, paramStrings: string[]): string {
  const decl = symbol.declaration;
  const paramsStr = paramStrings.join(', ');

  if (!decl) {
    return `${symbol.name}(${paramsStr})`;
  }

  switch (decl.kind) {
    case 'CircuitDefinition':
    case 'ExternalCircuit': {
      const parts: string[] = [];
      if (decl.isExport) parts.push('export');
      if (decl.isPure) parts.push('pure');
      parts.push('circuit');
      let sig = `${parts.join(' ')} ${decl.name}(${paramsStr})`;
      if (decl.returnType) sig += ` : ${formatTypeNode(decl.returnType)}`;
      return sig;
    }
    case 'WitnessDeclaration': {
      let sig = `witness ${decl.name}(${paramsStr})`;
      if (decl.returnType) sig += ` : ${formatTypeNode(decl.returnType)}`;
      return sig;
    }
    default:
      return `${symbol.name}(${paramsStr})`;
  }
}
