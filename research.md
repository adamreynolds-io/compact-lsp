# Research: compact-lsp

> **Note:** This document is a historical research artifact from the initial POC phase. The project has since evolved significantly — the hand-written lexer/parser replaced the planned compiler integration, and all LSP features listed under "Future iterations" have been implemented. See README.md and CLAUDE.md for current project state.

## Project Overview

**Name:** compact-lsp
**Type:** Language Server Protocol (LSP) Server
**Target Language:** [Compact Language](https://github.com/LFDT-Minokawa/compact)

## Confirmed Details

### About the Compact Language
- **Domain:** Smart contracts (blockchain/distributed ledger)
- **File Extension:** `.compact`
- **Existing Tooling:** Has a compiler/parser that can be leveraged
- **Repository:** https://github.com/LFDT-Minokawa/compact

### Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js
- **Testing:** Vitest

### Code Style & Tooling
- **Linting:** ESLint
- **Formatting:** Prettier
- **Git Workflow:** Trunk-based development (short-lived branches, frequent merges to main)

### Project Goals
- Provide LSP support for the Compact Language
- Integrate with existing Compact compiler/parser for accurate language understanding

## Resolved Questions

- [x] What is the Compact Language's purpose and use case? → Smart contracts for zero-knowledge proof circuits (Midnight Network)
- [x] What file extensions does it use? → `.compact`
- [x] What is the syntax like? → C-style / TypeScript-like (see Language Deep Dive below)
- [x] Is there an existing parser/compiler we can leverage? → Yes, Chez Scheme nanopass compiler
- [x] Is there a tree-sitter grammar? → Yes, https://github.com/midnightntwrk/compact-tree-sitter (stale)
- [x] What are the key language constructs to support? → circuits, ledger, witness, modules, structs, enums, types (see below)
- [x] Which LSP features are priorities? → Diagnostics + Hover (POC scope)
- [x] Are there specific smart contract constructs that need special support? → ledger state types, witness declarations, disclose(), pure/impure circuits
- [x] Will this use an existing LSP library? → vscode-languageserver
- [x] What's the deployment target? → VS Code extension

## Open Questions

- [ ] How will parsing/analysis be handled? → Integrate with Compact compiler (approach TBD: CLI invocation, library, or WASM)
- [ ] How will we get diagnostics from the Compact compiler? → `compactc --vscode` flag formats errors for IDE (see Compiler Integration below)
- [ ] How will we get hover info from the compiler? → May need `--trace-passes` or custom integration
- [ ] Can we invoke the Scheme compiler as a library from Node.js, or must we shell out?

### Compact Repositories

- **https://github.com/LFDT-Minokawa/compact** - Source code repository (Scheme compiler, runtime, examples, specification)
- **https://github.com/midnightntwrk/compact** - Release distribution only (binaries, no source code)

The LFDT-Minokawa repo is the primary source. The midnightntwrk repo only hosts release binaries (latest: compact-v0.4.0, January 2026).

---

## Compact Language Deep Dive

### Overview

Compact is a **strongly statically typed, bounded smart contract language** designed for the Midnight Network. It compiles to zero-knowledge (ZK) circuits targeting the Plonk proving system. The compiler is written in **Chez Scheme** using a **nanopass framework** architecture.

Key characteristics:
- Eager, call-by-value evaluation
- All bindings are immutable (`const` only, no reassignment)
- All iteration is bounded (no unbounded loops)
- Three execution domains: replicated ledger, ZK circuits, off-chain witnesses

### Syntax Style

The syntax is **C-style / TypeScript-like** with some unique features:
- C-style comments (`//` and `/* */`)
- Curly-brace blocks
- Semicolons required
- Type annotations use `:` syntax (like TypeScript)
- Generic parameters use `<>` angle brackets

### Program Structure

A Compact program consists of top-level declarations:

```compact
import CompactStandardLibrary;           // Standard import
import "path/to/file";                   // File import
import { name as alias } from Module;    // Selective import with aliasing
import { name } from Module prefix P$;   // Prefixed import

export { circuitName, ledgerField };     // Export list
export circuit foo(): [] { ... }         // Inline export

module MyModule<T> {                     // Generic module with type param
  export circuit bar(): T { ... }
}

struct Point { x: Field, y: Field }      // Struct definition
enum Direction { North, South, East, West } // Enum definition
type MyAlias = Uint<32>;                 // Type alias
new type MyDistinct = Uint<32>;          // Nominal/distinct type

ledger counter: Counter;                 // Ledger state declaration
export ledger value: Field;              // Exported ledger
sealed ledger immutableVal: Bytes<32>;   // Sealed (constructor-only write)

witness secretKey(): Bytes<32>;          // Witness function declaration

constructor(v: Field) { ... }           // Contract constructor (at most one)

circuit myCircuit(a: Field): Field { ... } // Circuit (function) definition
export pure circuit helper(x: Field): Field { ... } // Pure circuit
```

### Type System

#### Primitive Types

| Type | Description | Default |
|------|-------------|---------|
| `Boolean` | `true` or `false` | `false` |
| `Field` | Scalar prime field element of the ZK proving system | `0` |
| `Uint<N>` | Unsigned integer up to N bits (e.g., `Uint<32>`, `Uint<64>`) | `0` |
| `Uint<0..N>` | Unsigned integer with explicit range 0 to N | `0` |
| `Bytes<N>` | Fixed-length byte array of N bytes | all zeros |
| `Opaque<"string">` | Opaque type tagged with a string (for TypeScript interop) | N/A |
| `Void` / `[]` | Empty tuple, used as "void" return type | `[]` |

#### Composite Types

| Type | Description | Syntax |
|------|-------------|--------|
| Tuples | Heterogeneous fixed-size collections | `[Field, Boolean, Uint<32>]` |
| Vectors | Homogeneous fixed-size collections | `Vector<N, T>` (sugar for N-element tuple of T) |
| Structs | Named product types with fields | `struct Name { field: Type, ... }` |
| Enums | Named sum types (value-less variants only) | `enum Name { A, B, C }` |

#### Generic Types

Structs and modules support generic type parameters and size parameters:

```compact
struct Maybe<T> { is_some: Boolean, value: T }
module Container<T> { ... }
```

Generic parameters must be fully specialized at use sites.

#### Subtyping Rules

- `Uint<0..n>` is a subtype of `Uint<0..m>` when `n < m`
- `Uint<0..n>` is a subtype of `Field`
- Tuple subtyping is element-wise (covariant)
- Struct subtyping follows field types
- Numeric literals have type `Uint<0..n>` where `n` is the literal's value (e.g., `42` has type `Uint<0..42>`)

#### Type Aliases

```compact
type Counter32 = Uint<32>;        // Structural alias (interchangeable)
new type TokenId = Bytes<32>;     // Nominal/distinct type (not interchangeable)
```

#### Type Casting

The `as` operator performs type casts between compatible types:

```compact
expr as TargetType
```

Cast compatibility includes:
- Static casts (subtype to supertype)
- Numeric conversions (Uint widening/narrowing, Field to Uint)
- Bytes to/from Vector conversions
- Enum to/from numeric types
- Tuple to Vector and vice versa

#### Default Values

Every type has a default value accessible via `default<T>`:
- `Boolean` -> `false`
- Numeric types -> `0`
- `Bytes<N>` -> all zeros
- Tuples/Vectors -> element-wise defaults
- Structs -> field-wise defaults
- Enums -> first declared variant

### Scoping Model

**Lexical scoping** with the following scope boundaries:
- Program top-level
- Module body
- Circuit body (function scope)
- Block statements `{ ... }`
- For loop body

Rules:
- Duplicate bindings in the same scope are a static error
- Shadowing is allowed in nested scopes (inner identifier hides outer)
- `const` introduces immutable bindings (no reassignment)
- Circuit parameters are in scope for the circuit body
- For-loop iteration variable scoped to the loop body

### Statements

```compact
const x = expr;                          // Const binding (type inferred)
const x: Type = expr;                    // Const binding (type annotated)
const [a, b, c] = tupleExpr;            // Tuple destructuring
const { field1, field2: alias } = structExpr; // Struct destructuring

if (cond) { ... }                        // Conditional
if (cond) { ... } else { ... }           // Conditional with else

for (const i of vector) { ... }          // Iterate over vector elements
for (const i of lower..upper) { ... }    // Iterate over range (bounded)

return expr;                             // Return from circuit
return;                                  // Return void (empty tuple)

assert(boolExpr, "message");             // Runtime assertion

{ ... }                                  // Block statement
```

Note: `return` inside `for` loops is a static error.

### Expressions

#### Literals
- Boolean: `true`, `false`
- Numeric: `0`, `42`, `0xFF`, `0b1010`, `0o77`
- String: `"hello"` (becomes `Bytes<N>`)
- Padded string: `pad(32, "hello")` (zero-padded to N bytes)
- Tuple: `[expr1, expr2, ...]`
- Bytes literal: `Bytes[1, 2, 3]`
- Enum value: `EnumName.Variant`
- Default: `default<Type>`

#### Operators

| Category | Operators | Notes |
|----------|-----------|-------|
| Arithmetic | `+`, `-`, `*` | On numeric types; result type depends on operand types |
| Comparison | `==`, `!=` | On types with common supertype |
| Ordering | `<`, `>`, `<=`, `>=` | On unsigned integers only |
| Logical | `&&`, `\|\|` | Short-circuit evaluation |
| Negation | `!` | Boolean negation |
| Conditional | `cond ? thenExpr : elseExpr` | Ternary |
| Cast | `expr as Type` | Type conversion |
| Member | `struct.field` | Struct field access |
| Index | `tuple[N]` | Tuple/vector element access (compile-time index) |

#### Function Calls and Higher-Order Operations

```compact
circuitName(arg1, arg2)                    // Named circuit call
witnessName(arg1)                          // Witness call

(x: Field): Field => x + 1                // Anonymous circuit (arrow syntax)
(x: Field): Field => { return x + 1; }    // Anonymous circuit (block body)

map(fn, vector1, vector2, ...)             // Map over vectors
fold(fn, initialValue, vector1, ...)       // Fold/reduce over vectors
```

#### Struct Construction

```compact
Point { x: 1, y: 2 }                      // Named fields
Point { 1, 2 }                             // Positional fields
Point { ...existingPoint, y: 3 }           // Spread with override
```

#### Vector Spread and Slice

```compact
[...vec1, ...vec2]                         // Concatenate vectors
[...vec1, extraElem]                       // Append
slice<N>(vector, startIndex)               // Extract N elements from index
[...slice<3>(v, 0), ...slice<2>(v, 3)]     // Split and reassemble
```

### Smart-Contract-Specific Features

#### Circuits (Functions)

Circuits are the operational core -- they compile to zero-knowledge circuits:

```compact
circuit name(params): ReturnType {
  // body
}
```

- **Pure circuits**: Cannot access ledger state or call witnesses. Declared with `pure` keyword. Compiler verifies purity.
- **Impure circuits**: Can read/write ledger and call witnesses. This is the default.
- **Exported circuits**: Visible to external callers (TypeScript runtime). Declared with `export`.

#### Ledger State

Ledger declarations define public, replicated on-chain state:

```compact
ledger fieldName: StateType;
export ledger fieldName: StateType;     // Readable from TypeScript
sealed ledger fieldName: StateType;     // Only writable in constructor
```

**Ledger State Types (ADTs):**

| ADT | Description | Key Operations |
|-----|-------------|----------------|
| `Cell<T>` (implicit) | Single value container | `read()`, `write(v)`, `resetToDefault()` |
| `Counter` | 64-bit counter | `increment(n)`, `decrement(n)`, `read()`, `lessThan(n)` |
| `Set<T>` | Unbounded unique set | `insert(v)`, `remove(v)`, `member(v)`, `isEmpty()`, `size()` |
| `Map<K, V>` | Unbounded key-value map | `insert(k, v)`, `lookup(k)`, `member(k)`, `remove(k)`, `size()` |
| `List<T>` | Unbounded ordered list | `pushFront(v)`, `popFront()`, `head()`, `length()` |
| `MerkleTree<N, T>` | Depth-bounded Merkle tree (N: 2-32) | `insert(v)`, `checkRoot(digest)`, `isFull()` |
| `HistoricMerkleTree<N, T>` | Merkle tree with root history | All MerkleTree ops + historical root validation |

**Syntactic sugar for ledger access:**
- `ledgerField` is sugar for `ledgerField.read()`
- `ledgerField = value` is sugar for `ledgerField.write(value)`
- `counter += value` is sugar for `counter.increment(value)`
- `counter -= value` is sugar for `counter.decrement(value)`

#### Witness Functions

Witnesses call external (off-chain) TypeScript code. They bridge the ZK circuit with private state:

```compact
witness functionName(params): ReturnType;
```

Witnesses are declarations only (no body in Compact). The implementation is provided in TypeScript at runtime. Important: witness code is untrusted -- the contract cannot assume the witness implementation matches expectations.

#### The `disclose()` Function

`disclose(expr)` moves a value from the private (ZK) domain to the public (ledger) domain. Any value written to the ledger must be disclosed first. This is fundamental to the privacy model.

#### Constructor

```compact
constructor(params) {
  // Initialize ledger state
  // At most one per contract, top-level only
  // Returns [] (empty tuple)
}
```

#### Kernel Operations (Built-in)

| Operation | Description |
|-----------|-------------|
| `balance()` | Unshielded token balance (Uint<128>) |
| `checkpoint()` | Marks atomic execution boundary |
| `self()` | Current contract address |
| `blockTimeLt(t)` / `blockTimeGt(t)` etc. | Block time comparisons |
| `mintShielded(...)` / `mintUnshielded(...)` | Token minting |

#### Native Cryptographic Operations

| Operation | Description |
|-----------|-------------|
| `persistentHash<T>(value)` | Deterministic 32-byte hash |
| `transientHash<T>(value)` | Session-local hash to Field |
| `persistentCommit(value, randomness)` | Deterministic commitment |
| `ecAdd(p1, p2)` | Elliptic curve point addition |
| `ecMul(point, scalar)` | Elliptic curve scalar multiplication |
| `ecMulGenerator(scalar)` | Generator point multiplication |
| `hashToCurve<T>(value)` | Hash to elliptic curve point |

### Module System

Modules provide namespacing and encapsulation:

```compact
module Name {
  export circuit foo(): Field { ... }
  export struct Bar { ... }
  export ledger state: Counter;
  // Non-exported items are private to module
}

module GenericMod<T> {
  export circuit make(): T { ... }
}
```

**Import patterns:**
```compact
import CompactStandardLibrary;                    // Import entire standard library
import "path/to/file";                            // File-level import
import { item1, item2 } from ModuleName;          // Selective import
import { item as alias } from ModuleName;         // Aliased import
import { item } from ModuleName prefix P$;        // Prefixed import (becomes P$item)
import { item } from GenericMod<ConcreteType>;    // Import from generic module instantiation
```

Modules can be nested (module importing from other modules). Circular module dependencies are detected as errors.

### Standard Library (`CompactStandardLibrary`)

Key exports:
- `Maybe<T>` struct with `some<T>(v)` and `none<T>()` circuits
- `Either<A, B>` struct with `left<A,B>(v)` and `right<A,B>(v)` circuits
- `MerkleTreePath<N, T>` struct and `merkleTreePathRoot<N, T>(path)` circuit
- Shielded token operations: `mintShielded_token(...)`, `send(...)`, `receive(...)`, `burn(...)`
- Unshielded token operations: `mintUnshielded_token(...)`, `sendUnshielded(...)`, `receiveUnshielded(...)`
- Block time comparison circuits: `blockTimeLt(t)`, `blockTimeGte(t)`, etc.
- Elliptic curve types: `NativePoint`, `nativePointX()`, `nativePointY()`

### Error/Diagnostic Categories

The compiler produces diagnostics in these categories:

**Parse errors:**
- Unexpected tokens
- Missing expected syntax elements
- Invalid numeric literals (leading zeros, out-of-range)
- Unterminated strings/comments

**Binding/scope errors:**
- Unbound identifiers
- Duplicate bindings in same scope
- Using wrong kind of identifier (e.g., struct name as variable)

**Type errors:**
- Type mismatch (expected vs actual)
- Invalid subtype relationship
- Wrong number of generic parameters
- Missing generic type arguments (e.g., `none()` instead of `none<Field>()`)
- Invalid cast between incompatible types
- Tuple size mismatches in assignments

**Module errors:**
- Missing imports / unresolved includes
- Circular module dependencies
- Importing non-exported items

**Circuit/control flow errors:**
- Return inside for loops (static error)
- Unreachable code after return
- Impure operations in pure circuits

**Ledger errors:**
- Writing to sealed ledger outside constructor
- Invalid ledger state type usage

### Compiler Integration for LSP

**CLI usage:**
```
compactc [flags] <source-file> <output-dir>
```

**Key flags for LSP integration:**
- `--vscode` - Formats error messages as single lines for IDE integration
- `--skip-zk` - Skip proving key generation (faster for development)
- `--trace-passes` - Output intermediate representations

**Error output format with `--vscode`:**
The compiler has three problem matcher patterns (from the existing VS Code extension):
1. `compactException` - captures file path, line, character, and error message
2. `compactInternal` - internal compiler errors
3. `compactCommandNotFound` - missing compiler binary

**Existing VS Code Extension:**
Located at `editor-support/vsc/compact/` in the source repo. Current capabilities:
- Syntax highlighting via TextMate grammar
- Problem matchers for compiler output
- Project scaffolding from templates
- Does NOT implement LSP (no hover, no go-to-def, no completion)

**TextMate grammar keywords** (from `compact.tmLanguage.json`):
- Control: `as, assert, circuit, constructor, const, contract, default, disclose, else, enum, export, fold, for, from, if, import, include, ledger, map, module, new, of, pad, pure, return, sealed, slice, struct, type, witness`
- Types: `Bytes, Boolean, Field, Opaque, Uint, Vector`
- Booleans: `true, false`

---

## Reference: Tree-Sitter Grammar (Research Only)

**Repository:** https://github.com/midnightntwrk/compact-tree-sitter

Warning: Development abandoned ~9 months ago. The language has evolved significantly. Features like `type` aliases, `new type`, `sealed ledger`, `slice`, `pad`, vector/bytes literals, and various module import syntax were likely added after this grammar was last updated.

**Architecture Decision:** Integrate directly with the Compact compiler for all parsing and analysis.

---

## POC Scope (Decided)

**Goal:** Simple, demoable proof of concept

**Features:**
1. **Diagnostics** - Show errors/warnings from Compact compiler as editor squiggles
2. **Hover** - Display type info or documentation when hovering over symbols

**Deployment:** VS Code extension

**Future iterations (out of scope for POC):**
- Go-to-definition
- Find references
- Auto-completion
- Standalone server mode

## Next Steps

1. ~~Gather information about the Compact Language~~ → Smart contract language with `.compact` files
2. ~~Define priority LSP features~~ → Diagnostics + Hover for POC
3. ~~Decide deployment target~~ → VS Code extension
4. ~~Update project.md with complete details~~ → Done
5. ~~Investigate Compact compiler semantics~~ → Done (see Language Deep Dive above)
6. Determine compiler invocation strategy (CLI shell-out vs. library binding)
7. Parse `--vscode` error output format to extract diagnostics
8. Investigate `--trace-passes` output for type/symbol info (needed for hover)
9. Set up VS Code extension scaffolding with vscode-languageserver
