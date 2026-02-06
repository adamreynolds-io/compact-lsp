## Why

The Compact language has evolved significantly since the LSP parser was written (targeting ~v0.14). The latest language version (v0.21) introduces numerous syntax features — selective imports, new number literal formats, destructuring, spread syntax, `new type` declarations, and more — that the LSP cannot currently parse. Users editing modern `.compact` files see false parse errors and lose IDE features for any code using these constructs.

## What Changes

- **Lexer enhancements:** Support hex (`0xff`), binary (`0b10`), and octal (`0o7`) number literals; single-quoted string literals (`'hello'`); new keywords (`from`, `prefix`, `disclose`, `pad`, `slice`, `fold`, `map`, `default`)
- **Import system overhaul:** Selective imports (`import { foo, bar as baz } from Module`), prefix imports (`import Module prefix P$`), string-path imports (`import "path/to/Module"`)
- **Export list syntax:** `export { name1, name2 }`
- **`new type` declarations:** `new type MyAlias = SomeType;` including generic variants
- **Generic type aliases:** `type Pair<#A, #B> = [A, B];` (currently `type` aliases lack generic parameter support)
- **Destructuring patterns:** Tuple destructuring (`const [a, b] = expr`), struct destructuring (`const {x, y} = expr`), and parameter destructuring (`circuit f([x, y]: [Field, Field])`)
- **Multiple const bindings:** `const a = 1, b = 2;`
- **Spread syntax:** `[...a, ...b]` in tuple/vector literals and `S { ...s1, field: val }` in struct construction
- **`Bytes[...]` literal syntax:** `Bytes[1, 0xff, 0b11]`
- **Arrow functions with block bodies:** `(x) => { statements; return y; }`
- **`Uint<m..n>` range type syntax** for bounded unsigned integers
- **Struct field shorthand:** `Point { x, y }` equivalent to `Point { x: x, y: y }`
- **Assert with message:** `assert(cond, "message")`
- **Additional built-in functions:** `slice<N>()`, `disclose()`, `pad()`, `default<T>`, `transientHash<T>()`, `persistentHash<T>()`, `ecAdd()`, `ecMul()`, `ownPublicKey()`, and others
- **Ledger state ADT types:** `Counter`, `Set<T>`, `Map<K, V>`, `List<T>`, `MerkleTree<n, T>`, `Cell<T>`, `Kernel` with their method signatures

## Capabilities

### New Capabilities
- `import-system`: Selective imports, prefix imports, string-path imports, and export lists
- `number-literals`: Hex, binary, and octal number literal support in lexer and parser
- `string-literals`: Single-quoted string literals
- `destructuring`: Tuple and struct destructuring in const bindings and parameters
- `spread-syntax`: Spread expressions in tuples/vectors and struct construction
- `new-type-decl`: `new type` declarations and generic type aliases
- `bytes-literal`: `Bytes[...]` literal expression syntax
- `block-arrow-fn`: Arrow functions with block statement bodies
- `built-in-registry`: Comprehensive registry of built-in functions, ledger ADT types, and their signatures

### Modified Capabilities
- `parser`: Update statement parsing for multiple const bindings, assert-with-message, struct field shorthand, `Uint<m..n>` range types

## Impact

- **Lexer** (`server/src/lexer.ts`): New token types and number literal parsing logic
- **Parser** (`server/src/parser.ts`): Significant additions for imports, exports, destructuring, spread, `new type`, `Bytes[...]`, block arrow functions
- **AST** (`server/src/ast.ts`): New node types for import variants, destructuring patterns, spread expressions, `new type`, `Bytes[...]`
- **Symbol table** (`server/src/symbols.ts`): Handle new declaration types, destructured bindings, expanded built-in registry
- **All providers** (hover, completion, definition, references, rename, diagnostics, semantic tokens, signature help, document symbols): Adapt to new AST node types
- **Test suite**: Extensive new tests for every added construct
