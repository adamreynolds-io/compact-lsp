## 1. AST Changes

- [x] 1.1 Add `StringArgument` interface to `server/src/ast.ts`
- [x] 1.2 Update `TypeArgument` union to include `StringArgument`

## 2. Parser Changes

- [x] 2.1 Import `StringArgument` in `server/src/parser.ts`
- [x] 2.2 Handle `StringLiteral` tokens in `parseParameterizedType()` to produce `StringArgument` nodes
- [x] 2.3 Add safety guard (position check) to prevent infinite loops from unhandled tokens

## 3. Symbol Table / Formatting

- [x] 3.1 Add `StringArgument` case to `formatTypeNode()` in `server/src/symbols.ts`

## 4. Lexer Changes

- [x] 4.1 Add block comment (`/* */` and `/** */`) skipping in `server/src/lexer.ts`

## 5. Tests

- [x] 5.1 Add lexer tests for block comments (basic, JSDoc, multi-line, unterminated, between tokens)
- [x] 5.2 Add parser tests for string type arguments (`Opaque<"string">`, nested, expression position)
- [x] 5.3 Add parser test for code with block comments producing no errors
- [x] 5.4 Add hover test for `Opaque<"CoinInfo">` type display

## 6. Verification

- [x] 6.1 All existing tests pass (461 original)
- [x] 6.2 All new tests pass (10 new, 471 total)
- [x] 6.3 All 9 OZ main contracts parse without OOM/crash
- [x] 6.4 Ownable, Initializable, Pausable parse with 0 errors
