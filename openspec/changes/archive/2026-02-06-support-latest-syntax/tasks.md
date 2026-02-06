## 1. Lexer Enhancements

- [x] 1.1 Add hex number literal support (`0x`/`0X` prefix) to `scanNumber()` in `lexer.ts`
- [x] 1.2 Add binary number literal support (`0b`/`0B` prefix) to `scanNumber()` in `lexer.ts`
- [x] 1.3 Add octal number literal support (`0o`/`0O` prefix) to `scanNumber()` in `lexer.ts`
- [x] 1.4 Add single-quoted string literal support to `scanString()` in `lexer.ts`
- [x] 1.5 Write lexer tests for hex, binary, octal literals and single-quoted strings

## 2. AST New Node Types

- [x] 2.1 Add `ImportSpecifier`, extended `ImportDeclaration` (specifiers, prefix, source fields), and `ExportList` to `ast.ts`
- [x] 2.2 Add `NewTypeDeclaration` node type to `ast.ts` and add to `Declaration` union
- [x] 2.3 Add `SpreadExpression` node type to `ast.ts` and add to `Expression` union
- [x] 2.4 Add `BytesLiteral` node type to `ast.ts` and add to `Expression` union
- [x] 2.5 Add `TuplePattern` and `StructPattern` types to `ast.ts` for destructuring
- [x] 2.6 Extend `ConstStatement` and `Parameter` to accept pattern union (`string | TuplePattern | StructPattern`)
- [x] 2.7 Extend `ArrowFunction.body` type to `Expression | Statement[]`
- [x] 2.8 Add optional `message` field to `AssertStatement`
- [x] 2.9 Add optional `spread` field to `StructConstruction` and `isShorthand` to `StructFieldInit`

## 3. Parser — Import System

- [x] 3.1 Parse selective imports: `import { name, name as alias } from Module;`
- [x] 3.2 Parse prefix imports: `import Module prefix P$;`
- [x] 3.3 Parse string-path imports: `import "path/to/Module" prefix P$;`
- [x] 3.4 Parse export lists: `export { name1, name2 };`
- [x] 3.5 Write parser tests for all import/export variants

## 4. Parser — New Type Declarations

- [x] 4.1 Parse `new type Name = TypeExpr;` declarations (with export, generics)
- [x] 4.2 Parse generic type aliases: `type Name<#A, #B> = TypeExpr;`
- [x] 4.3 Write parser tests for `new type` and generic type aliases

## 5. Parser — Expression Enhancements

- [x] 5.1 Parse `Bytes[...]` literal expressions, disambiguating from index expressions
- [x] 5.2 Parse spread expressions (`...expr`) in tuple literals
- [x] 5.3 Parse spread expressions in struct construction (`S { ...s1, field: val }`)
- [x] 5.4 Parse struct field shorthand (`Point { x, y }` → `Point { x: x, y: y }`)
- [x] 5.5 Write parser tests for Bytes literals, spread, and struct shorthand

## 6. Parser — Statement Enhancements

- [x] 6.1 Parse multiple const bindings: `const a = 1, b = 2;`
- [x] 6.2 Parse assert with message: `assert(cond, "msg");`
- [x] 6.3 Parse arrow functions with block bodies: `(x) => { stmts; }`
- [x] 6.4 Parse `Uint<m..n>` range type arguments
- [x] 6.5 Write parser tests for multiple const, assert message, block arrows, range types

## 7. Parser — Destructuring

- [x] 7.1 Parse tuple destructuring in const statements: `const [a, b] = expr;`
- [x] 7.2 Parse struct destructuring in const statements: `const {a, b: alias} = expr;`
- [x] 7.3 Parse destructuring in parameter positions: `circuit f([x, y]: [Field, Field])`
- [x] 7.4 Handle skipped elements in tuple destructuring: `const [x, , , y] = expr;`
- [x] 7.5 Write parser tests for all destructuring variants

## 8. Symbol Table Updates

- [x] 8.1 Register selective import specifiers (with alias) in file scope
- [x] 8.2 Register `new type` and generic type alias names as symbols
- [x] 8.3 Register destructured bindings (tuple and struct) as individual symbols in scope
- [x] 8.4 Create scope for block-body arrow functions with parameter and local bindings
- [x] 8.5 Expand `initializeRootScope()` with all built-in functions (disclose, pad, slice, default, transientHash, persistentHash, ecAdd, ecMul, ecMulGenerator, hashToCurve, ownPublicKey, etc.)
- [x] 8.6 Add ledger ADT type methods (Counter, Set, Map, List, MerkleTree, Cell, Kernel) to root scope
- [x] 8.7 Write symbol table tests for new declaration types and built-in registry

## 9. Provider Updates

- [x] 9.1 Update hover provider for new AST nodes (imports, new type, Bytes literal, spread)
- [x] 9.2 Update completion provider for built-in functions, ledger ADT methods, and import specifiers
- [x] 9.3 Update definition provider for selective import specifiers and destructured bindings
- [x] 9.4 Update references provider for new declaration types
- [x] 9.5 Update diagnostics provider to avoid false errors on new syntax
- [x] 9.6 Update document symbols for new declaration types (new type, export list, extended imports)
- [x] 9.7 Update rename provider for destructured bindings
- [x] 9.8 Update semantic tokens for new token/node types
- [x] 9.9 Update signature help for new built-in functions
- [x] 9.10 Write provider tests for new syntax constructs

## 10. Integration and Validation

- [x] 10.1 Create comprehensive `.compact` test fixture using all new syntax features
- [x] 10.2 Run full test suite and fix any regressions
- [x] 10.3 Test with real `.compact` files from Compact repositories
- [x] 10.4 Manual smoke test in VS Code extension
