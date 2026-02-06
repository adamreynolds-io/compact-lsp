## Why

The OpenZeppelin compact-contracts are the primary real-world Compact codebase. 4 of 9 main contracts crash the parser with OOM due to an infinite loop triggered by `Opaque<"string">` syntax (string literal type arguments). Additionally, all 9 contracts use `/** JSDoc */` block comments which the lexer doesn't handle, producing spurious ErrorNodes and diagnostic noise.

## What Changes

- Add `StringArgument` AST node and parser support for string literal type arguments (e.g., `Opaque<"CoinInfo">`)
- Add safety guard in `parseParameterizedType()` to prevent infinite loops from any future unhandled token types
- Add block comment (`/* */` and `/** */`) skipping in the lexer
- Add `StringArgument` formatting in `formatTypeNode()` for correct hover/completion display

## Capabilities

### New Capabilities

### Modified Capabilities
- `parser`: Add string literal handling in type argument parsing and infinite-loop safety guard
- `string-literals`: Lexer now skips block comments (which previously broke tokenization around string-heavy code)

## Impact

- `server/src/ast.ts` — New `StringArgument` interface, updated `TypeArgument` union
- `server/src/parser.ts` — String literal type arg parsing + safety guard in `parseParameterizedType()`
- `server/src/symbols.ts` — `StringArgument` case in `formatTypeNode()`
- `server/src/lexer.ts` — Block comment skipping
- All 9 OZ main contracts now parse without crashing (previously 4 caused OOM)
- 3 of 9 parse with 0 errors; remaining errors are from a separate feature (generic type args in expression position)
