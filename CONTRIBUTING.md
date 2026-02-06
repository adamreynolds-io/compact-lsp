# Contributing to compact-lsp

## Architecture

The server processes `.compact` files through a pipeline:

```
Source text → Lexer → Tokens → Parser → AST → Symbol Table → LSP Providers
```

1. **Lexer** (`lexer.ts`) tokenizes Compact source into a flat token stream
2. **Parser** (`parser.ts`) consumes tokens and builds an AST using a Pratt parser for expressions and a statement parser for declaration bodies
3. **AST** (`ast.ts`) defines the node types produced by the parser
4. **Symbol Table** (`symbols.ts`) walks the AST to build a scope hierarchy (root → file → module → circuit → block/for/arrow) with symbol declarations and a flat reference list
5. **Providers** use the AST, symbol table, and token stream to answer LSP requests

The server (`server.ts`) wires everything together: on each document change, it re-lexes, re-parses, rebuilds the symbol table, and pushes diagnostics. Other LSP requests (hover, definition, etc.) query the cached parse result and symbol table.

## Module Responsibilities

| File | Role |
|------|------|
| `lexer.ts` | Tokenizer — produces token stream from source text |
| `parser.ts` | Pratt parser for expressions, statement parser for bodies |
| `ast.ts` | AST node type definitions (SourceFile, declarations, expressions, statements) |
| `symbols.ts` | Symbol table construction, scope hierarchy, symbol resolution |
| `utils.ts` | Shared utilities: `findTokenAtPosition`, `findScopeForPosition`, `isPositionInRange` |
| `server.ts` | LSP server entry point, handler wiring, document state management |
| `hover.ts` | Hover provider — type info and signatures |
| `definition.ts` | Go-to-definition provider |
| `references.ts` | Find-references provider |
| `completion.ts` | Auto-completion provider |
| `diagnostics.ts` | Diagnostics provider — parse errors and undefined references |
| `documentSymbols.ts` | Document symbols provider — hierarchical outline |
| `rename.ts` | Rename provider with prepare-rename validation |
| `signatureHelp.ts` | Signature help provider — parameter hints for calls |
| `semanticTokens.ts` | Semantic tokens provider — symbol-aware syntax highlighting |

## Development Workflow

### Running Tests

```sh
# Full test suite (227 tests)
npm test

# Watch mode
npm run test:watch

# Single test file
npx vitest run server/src/hover.test.ts
```

### Linting and Formatting

```sh
npm run lint        # ESLint
npm run format      # Prettier (write)
npm run format:check  # Prettier (check only)
```

Always run lint and format before committing.

### Testing in VS Code

1. `npm run build` to compile the server and extension
2. Open the project in VS Code
3. Press **F5** to launch the Extension Development Host
4. Open a `.compact` file in the new window to test features

### Adding a New LSP Feature

1. Create a new provider file (e.g., `server/src/myFeature.ts`) exporting a pure function that takes the parse result, symbol table, and position
2. Create a test file (e.g., `server/src/__tests__/myFeature.test.ts`)
3. Wire the handler in `server.ts`: register the capability in `onInitialize` and add the `connection.on*` handler
4. Run `npm test` to verify

## Testing Conventions

Tests live alongside source files (`*.test.ts`) or in `server/src/__tests__/`. All tests use Vitest.

Provider tests follow a **parse-and-query** pattern:

```typescript
import { parse } from '../parser';
import { buildSymbolTable } from '../symbols';
import { getHoverInfo } from '../hover';

it('shows hover for circuit', () => {
  const source = `circuit add(x: Field, y: Field) : Field { return x; }`;
  const parseResult = parse(source);
  const { fileScope } = buildSymbolTable(parseResult.sourceFile);

  const result = getHoverInfo(parseResult, fileScope, 0, 8, source);

  expect(result).toBeDefined();
  expect(result!.contents).toContain('circuit add');
});
```

Key points:
- Parse a Compact source string with `parse(source)`
- Build the symbol table with `buildSymbolTable(parseResult.sourceFile)` — this returns `{ fileScope, references }`
- Call the provider function with position coordinates (0-indexed line and column)
- Assert on the provider's return value

## Code Style

- **ESLint** with `@typescript-eslint` for linting
- **Prettier** for formatting
- Run `npm run lint` and `npm run format` before committing
- No strict commit message convention — keep commits focused and atomic
