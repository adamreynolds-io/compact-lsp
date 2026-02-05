## Context

This is a greenfield LSP server for the Compact smart contract language. There is no existing codebase — the project starts from scratch. The existing Compact tooling includes a Scheme-based compiler and a basic VS Code extension that provides only syntax highlighting (TextMate grammar). Neither provides LSP capabilities.

The LSP server is deliberately decoupled from the Compact compiler. It includes its own hand-written recursive descent parser and builds its own symbol table for semantic understanding. This means users don't need the compiler installed to get IDE features.

The parser is designed for a phased roadmap: Phase 1 (POC) covers the lexer and declaration-level parsing — enough for hover and basic diagnostics. Phase 2 adds full expression/statement parsing and error recovery. Phase 3 adds incremental reparsing and advanced analysis.

## Goals / Non-Goals

**Goals:**
- Deliver a demoable VS Code extension with hover and diagnostics for `.compact` files
- Hand-written lexer and recursive descent parser for Compact (declaration-level for POC)
- Build a shallow symbol table: declarations, scopes, annotated types (no inference)
- Surface syntax errors from the parser as diagnostics
- Surface semantic errors (undefined references, scope violations) as diagnostics
- Show declaration signatures on hover (circuits, ledgers, witnesses, structs, enums, types)

**Non-Goals:**
- Type inference or subtype checking
- Generic instantiation or resolution
- Full expression/statement parsing (POC parses declaration signatures, skips bodies)
- Go-to-definition, find-references, or auto-completion
- Standalone server mode (non-VS Code editors)
- Cross-file analysis (imports/includes resolve to declarations only if in the same file)
- Domain tracking (public/ZK/off-chain boundaries)

## Decisions

### 1. Hand-written recursive descent parser

A hand-written lexer + recursive descent parser in TypeScript, with no external parser dependencies.

**Rationale:** Every mature language server uses this approach (TypeScript, rust-analyzer, gopls). It gives full control over error recovery, AST shape, and position tracking — all critical for tooling. Compact's grammar is small enough that this is manageable (~1500-2500 lines at full coverage). No dependencies to outgrow.

**Alternatives considered:**
- Tree-sitter: rejected — creates a dependency on a stale external grammar and WASM runtime
- Chevrotain: good framework, but adds a dependency and constrains AST design
- PEG (Peggy): fast to prototype but poor error recovery — would need rewriting
- ANTLR4: mature but generates Java-style code, heavy runtime

### 2. Phased parser roadmap

**Phase 1 (POC):** Lexer + declaration-level parser. Parses top-level constructs and their signatures (circuit name/params/return type, ledger name/type, struct fields, enum variants, etc.). Expression bodies are skipped or consumed as token runs. This is enough for hover on signatures and scope-based diagnostics.

**Phase 2:** Full expression and statement parsing. Control flow (if/for), assignments, function calls, operators. Error recovery at statement/declaration boundaries (synchronize at `;` and `}`).

**Phase 3:** Incremental reparsing, cross-file resolution, type inference.

**Rationale:** Phase 1 delivers a demoable POC with minimal parser investment. The declaration-level parser covers what hover and undefined-ref diagnostics actually need. Full expression parsing adds significant work with limited POC value.

### 3. Monorepo structure with separate server and extension packages

The project uses a single repository with two logical packages:
- `server/` — the LSP server (TypeScript, Node.js), including parser and analysis
- `extension/` — the VS Code extension client (TypeScript)

Both share a root `package.json` for dev tooling (ESLint, Prettier, Vitest). The extension bundles the server at package time.

**Alternatives considered:**
- Separate repos: adds coordination overhead for a POC with one developer
- Single flat package: mixes client and server concerns

### 4. Shallow symbol table — declarations and scopes only

The symbol table tracks:
- **Declarations**: name, kind (circuit/ledger/witness/struct/enum/const/type), annotated type signature, scope, position
- **Scopes**: hierarchical (file → module → circuit → block), parent references
- **References**: identifier usages linked to their scope for resolution

It does NOT track:
- Inferred types (only explicitly annotated types)
- Resolved generics
- Cross-file symbols

**Rationale:** This is the minimum needed to power hover (show signatures) and basic diagnostics (undefined refs). Type inference and generics add significant complexity for marginal POC value.

### 5. Full document sync with full reparse

Use `TextDocumentSyncKind.Full` — the client sends the entire document on each change, and we reparse + rebuild the symbol table.

**Rationale:** Full reparse is simpler to implement and fast enough for smart contract file sizes (typically < 1000 lines). Incremental reparsing is a Phase 3 optimization.

### 6. Diagnostics on document change

Diagnostics are computed and pushed to the client on every `textDocument/didChange` and `textDocument/didOpen` event. No debouncing for the POC.

**Rationale:** Simplicity. Lexing + declaration parsing + symbol table walk is fast enough that debouncing isn't needed for typical file sizes.

## Risks / Trade-offs

- **Declaration-only parsing** → Errors inside expression bodies won't be caught in Phase 1. The parser will skip or loosely consume body content. Mitigation: acceptable for POC, Phase 2 adds full parsing.
- **No cross-file resolution** → Imports and includes won't resolve symbols from other files. Hover and diagnostics only work within a single file. Mitigation: acceptable for POC, note as known limitation.
- **No type inference** → `const x = someCircuit(a, b)` won't know the type of `x` unless annotated. Hover will show "const x" without a type. Mitigation: still useful for declared signatures; type inference is Phase 3.
- **Parser maintenance** → Hand-written parser requires manual updates as Compact evolves. Mitigation: the grammar is small and changes are infrequent. The control benefits outweigh the maintenance cost.
- **Error recovery quality** → Phase 1 has minimal error recovery (skip to next declaration boundary). May produce poor ASTs for heavily broken files. Mitigation: Phase 2 adds statement-level synchronization.
