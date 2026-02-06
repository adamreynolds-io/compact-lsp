import { SourceRange, ParseResult, ImportDeclaration } from './ast';
import { Scope, Reference } from './symbols';
import { Token } from './lexer';
import { Diagnostic } from './diagnostics';
import { WorkspaceIndex } from './workspaceIndex';

export interface TextEditResult {
  range: SourceRange;
  newText: string;
  uri?: string;
}

export interface CodeActionResult {
  title: string;
  kind: 'quickfix' | 'refactor';
  edits: TextEditResult[];
  diagnostics?: Diagnostic[];
}

export function getCodeActions(
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  tokens: Token[],
  diagnostics: Diagnostic[],
  range: SourceRange,
  source: string,
  workspaceIndex?: WorkspaceIndex,
): CodeActionResult[] {
  const actions: CodeActionResult[] = [];

  // Quick fixes from diagnostics
  for (const diag of diagnostics) {
    if (diag.code === 'undefined-reference' && workspaceIndex) {
      actions.push(...fixUndefinedReference(diag, parseResult, source, workspaceIndex));
    }
    if (diag.code === 'specifier-not-exported') {
      actions.push(...fixSpecifierNotExported(diag, parseResult, source));
    }
    if (diag.code === 'module-not-found' && workspaceIndex) {
      actions.push(...suggestSimilarModule(diag, parseResult, source, workspaceIndex));
    }
  }

  // Refactoring actions (always available)
  actions.push(...extractToConst(range, source, parseResult, tokens));
  actions.push(...removeUnusedImport(range, parseResult, fileScope, references, source));

  return actions;
}

function extractNameFromMessage(message: string): string | undefined {
  const match = message.match(/^'([^']+)'/);
  return match ? match[1] : undefined;
}

function findLastImportEndLine(parseResult: ParseResult): number {
  let lastImportLine = -1;
  for (const decl of parseResult.sourceFile.declarations) {
    if (decl.kind === 'ImportDeclaration') {
      if (decl.range.end.line > lastImportLine) {
        lastImportLine = decl.range.end.line;
      }
    }
  }
  return lastImportLine;
}

function fixUndefinedReference(
  diag: Diagnostic,
  parseResult: ParseResult,
  source: string,
  workspaceIndex: WorkspaceIndex,
): CodeActionResult[] {
  const name = extractNameFromMessage(diag.message);
  if (!name) return [];

  const actions: CodeActionResult[] = [];

  for (const [, entry] of workspaceIndex.files) {
    if (entry.exports.has(name)) {
      const moduleName = entry.moduleName;
      const insertLine = findLastImportEndLine(parseResult) + 1;
      const importText = `import { ${name} } from ${moduleName};\n`;

      actions.push({
        title: `Add import of '${name}' from ${moduleName}`,
        kind: 'quickfix',
        edits: [
          {
            range: {
              start: { line: insertLine, column: 0, offset: 0 },
              end: { line: insertLine, column: 0, offset: 0 },
            },
            newText: importText,
          },
        ],
        diagnostics: [diag],
      });
    }
  }

  return actions;
}

function fixSpecifierNotExported(
  diag: Diagnostic,
  parseResult: ParseResult,
  source: string,
): CodeActionResult[] {
  // Extract specifier name from "Module 'X' does not export 'Y'"
  const match = diag.message.match(/does not export '([^']+)'/);
  if (!match) return [];
  const specName = match[1];

  // Find the import declaration containing this specifier
  for (const decl of parseResult.sourceFile.declarations) {
    if (decl.kind !== 'ImportDeclaration' || !decl.specifiers) continue;

    const specIndex = decl.specifiers.findIndex((s) => s.name === specName);
    if (specIndex === -1) continue;

    // Check if the specifier range overlaps with the diagnostic range
    const spec = decl.specifiers[specIndex];
    if (
      spec.range.start.line !== diag.range.start.line ||
      spec.range.start.column !== diag.range.start.column
    )
      continue;

    if (decl.specifiers.length === 1) {
      // Only specifier — remove entire import
      const endLine = decl.range.end.line;

      return [
        {
          title: `Remove import from ${decl.moduleName}`,
          kind: 'quickfix',
          edits: [
            {
              range: {
                start: { line: decl.range.start.line, column: 0, offset: 0 },
                end: {
                  line: endLine + 1,
                  column: 0,
                  offset: 0,
                },
              },
              newText: '',
            },
          ],
          diagnostics: [diag],
        },
      ];
    } else {
      // Multiple specifiers — remove just this one
      // Rebuild the specifier list without the invalid one
      const remaining = decl.specifiers.filter((_, i) => i !== specIndex);
      const specList = remaining.map((s) => (s.alias ? `${s.name} as ${s.alias}` : s.name));
      const newImport = `import { ${specList.join(', ')} } from ${decl.source || decl.moduleName};`;

      const lines = source.split('\n');
      const endLine = decl.range.end.line;
      const endCol = lines[endLine] !== undefined ? lines[endLine].length : decl.range.end.column;

      return [
        {
          title: `Remove '${specName}' from import`,
          kind: 'quickfix',
          edits: [
            {
              range: {
                start: {
                  line: decl.range.start.line,
                  column: decl.range.start.column,
                  offset: 0,
                },
                end: { line: endLine, column: endCol, offset: 0 },
              },
              newText: newImport,
            },
          ],
          diagnostics: [diag],
        },
      ];
    }
  }

  return [];
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function suggestSimilarModule(
  diag: Diagnostic,
  parseResult: ParseResult,
  source: string,
  workspaceIndex: WorkspaceIndex,
): CodeActionResult[] {
  const match = diag.message.match(/Module '([^']+)' not found/);
  if (!match) return [];
  const moduleName = match[1];

  // Find the import declaration for this diagnostic
  let targetDecl: ImportDeclaration | undefined;
  for (const decl of parseResult.sourceFile.declarations) {
    if (decl.kind !== 'ImportDeclaration') continue;
    const declModName = decl.source || decl.moduleName;
    if (declModName === moduleName) {
      targetDecl = decl;
      break;
    }
  }
  if (!targetDecl) return [];

  const threshold = Math.max(2, Math.floor(moduleName.length / 3));
  const candidates: { name: string; distance: number }[] = [];

  for (const [, entry] of workspaceIndex.files) {
    if (!entry.moduleName) continue;
    const dist = levenshtein(moduleName.toLowerCase(), entry.moduleName.toLowerCase());
    if (dist > 0 && dist <= threshold) {
      candidates.push({ name: entry.moduleName, distance: dist });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);

  const actions: CodeActionResult[] = [];
  const lines = source.split('\n');
  const declLine = lines[targetDecl.range.start.line];
  const moduleStart = declLine.lastIndexOf(moduleName);

  if (moduleStart === -1) return actions;

  for (const candidate of candidates.slice(0, 3)) {
    actions.push({
      title: `Did you mean '${candidate.name}'?`,
      kind: 'quickfix',
      edits: [
        {
          range: {
            start: {
              line: targetDecl.range.start.line,
              column: moduleStart,
              offset: 0,
            },
            end: {
              line: targetDecl.range.start.line,
              column: moduleStart + moduleName.length,
              offset: 0,
            },
          },
          newText: candidate.name,
        },
      ],
      diagnostics: [diag],
    });
  }

  return actions;
}

function extractToConst(
  range: SourceRange,
  source: string,
  parseResult: ParseResult,
  tokens: Token[],
): CodeActionResult[] {
  // Only offer if there's a non-empty selection
  if (range.start.line === range.end.line && range.start.column === range.end.column) {
    return [];
  }

  const lines = source.split('\n');

  // Extract the selected text
  let selectedText: string;
  if (range.start.line === range.end.line) {
    selectedText = lines[range.start.line].substring(range.start.column, range.end.column);
  } else {
    const parts: string[] = [];
    parts.push(lines[range.start.line].substring(range.start.column));
    for (let i = range.start.line + 1; i < range.end.line; i++) {
      parts.push(lines[i]);
    }
    parts.push(lines[range.end.line].substring(0, range.end.column));
    selectedText = parts.join('\n');
  }

  // Validate: must be non-whitespace and look like an expression
  selectedText = selectedText.trim();
  if (!selectedText || selectedText.includes(';') || selectedText.includes('{')) {
    return [];
  }

  // Check selected tokens form a valid expression (at least one token fully within range)
  const tokensInRange = tokens.filter((t) => {
    const tokenEndColumn = t.pos.column + t.text.length;
    const afterStart =
      t.pos.line > range.start.line ||
      (t.pos.line === range.start.line && t.pos.column >= range.start.column);
    const beforeEnd =
      t.pos.line < range.end.line ||
      (t.pos.line === range.end.line && tokenEndColumn <= range.end.column);
    return afterStart && beforeEnd;
  });

  if (tokensInRange.length === 0) {
    return [];
  }

  // Find the indentation of the line where the selection starts
  const startLine = lines[range.start.line];
  const indent = startLine.match(/^(\s*)/)?.[1] || '';

  return [
    {
      title: 'Extract to const',
      kind: 'refactor',
      edits: [
        // Insert const declaration before the current line
        {
          range: {
            start: { line: range.start.line, column: 0, offset: 0 },
            end: { line: range.start.line, column: 0, offset: 0 },
          },
          newText: `${indent}const extracted = ${selectedText};\n`,
        },
        // Replace the selected expression with the variable name
        {
          range: {
            start: { line: range.start.line, column: range.start.column, offset: 0 },
            end: { line: range.end.line, column: range.end.column, offset: 0 },
          },
          newText: 'extracted',
        },
      ],
    },
  ];
}

function removeUnusedImport(
  range: SourceRange,
  parseResult: ParseResult,
  fileScope: Scope,
  references: Reference[],
  source: string,
): CodeActionResult[] {
  // Find import declarations that overlap with the cursor/range
  for (const decl of parseResult.sourceFile.declarations) {
    if (decl.kind !== 'ImportDeclaration' || !decl.specifiers) continue;

    // Check if cursor is within this import declaration
    if (
      range.start.line < decl.range.start.line ||
      range.start.line > decl.range.end.line
    )
      continue;

    const actions: CodeActionResult[] = [];

    for (const spec of decl.specifiers) {
      // Check if cursor is on this specifier
      if (
        range.start.line !== spec.range.start.line ||
        range.start.column < spec.range.start.column ||
        range.start.column > spec.range.end.column
      )
        continue;

      const localName = spec.alias || spec.name;

      // Check if any reference in the file uses this symbol
      const isUsed = references.some((ref) => ref.name === localName);

      if (!isUsed) {
        if (decl.specifiers.length === 1) {
          // Only specifier — remove entire import
          const endLine = decl.range.end.line;

          actions.push({
            title: `Remove unused import '${localName}'`,
            kind: 'refactor',
            edits: [
              {
                range: {
                  start: { line: decl.range.start.line, column: 0, offset: 0 },
                  end: { line: endLine + 1, column: 0, offset: 0 },
                },
                newText: '',
              },
            ],
          });
        } else {
          // Multiple specifiers — remove just this one
          const remaining = decl.specifiers.filter((s) => s !== spec);
          const specList = remaining.map((s) =>
            s.alias ? `${s.name} as ${s.alias}` : s.name,
          );
          const newImport = `import { ${specList.join(', ')} } from ${decl.source || decl.moduleName};`;

          const lines = source.split('\n');
          const endLine = decl.range.end.line;
          const endCol =
            lines[endLine] !== undefined ? lines[endLine].length : decl.range.end.column;

          actions.push({
            title: `Remove unused import '${localName}'`,
            kind: 'refactor',
            edits: [
              {
                range: {
                  start: {
                    line: decl.range.start.line,
                    column: decl.range.start.column,
                    offset: 0,
                  },
                  end: { line: endLine, column: endCol, offset: 0 },
                },
                newText: newImport,
              },
            ],
          });
        }
      }
    }

    if (actions.length > 0) return actions;
  }

  return [];
}
