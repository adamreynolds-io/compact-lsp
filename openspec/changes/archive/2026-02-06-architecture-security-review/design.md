## Context

The compact-lsp server processes untrusted document content from the editor through a pipeline: lexer → parser → symbol table → providers. A code review identified several areas for hardening and cleanup:

1. The Pratt expression parser uses unbounded recursion — deeply nested expressions can stack-overflow the server process
2. No file size guard — extremely large files can freeze the server
3. Parser lookahead functions scan ahead without bounds
4. Six providers independently call `tokenize(source)` on every request, doing redundant work
5. `formatTypeNode()` is implemented three separate times in `symbols.ts`, `signatureHelp.ts`, and `documentSymbols.ts`
6. Parser catch blocks silently swallow exceptions with no logging

## Goals / Non-Goals

**Goals:**
- Prevent resource exhaustion from adversarial or malformed input
- Eliminate redundant tokenization across providers
- Consolidate duplicated formatting logic
- Add development-mode error logging for parser recovery paths

**Non-Goals:**
- Splitting the parser into multiple files (works fine as-is for POC)
- Adding a Range utility class (minimal duplication doesn't justify the abstraction)
- Incremental reparsing or document diffing
- Performance profiling or optimization beyond the token caching

## Decisions

### 1. Expression recursion depth limit

**Decision:** Add a `depth` parameter to `parseExpression()`, `parsePrefixExpression()`, and `parseInfixExpression()`. Return an error expression node when depth exceeds 200.

**Why 200:** Node.js default stack allows thousands of frames, but 200 levels of expression nesting is far beyond any legitimate Compact code. A lower limit would be overly restrictive for complex but valid expressions.

**Alternative considered:** Global depth counter on the parser class. Rejected because passing the parameter explicitly makes the control flow visible and testable.

### 2. File size limit in analyzeDocument

**Decision:** Add a check at the top of `analyzeDocument()`. If `text.length > 1_000_000` (1 MB), skip analysis and send a single warning diagnostic.

**Why 1 MB:** Smart contracts are typically under 10 KB. A 1 MB limit provides ample headroom while preventing pathological cases.

**Alternative considered:** Truncating the file and parsing a prefix. Rejected because partial parsing would produce confusing diagnostics.

### 3. Lookahead bounds

**Decision:** Add a token limit (500 tokens) to the while loops in `looksLikeArrowFunction()` and `looksLikeStructConstruction()`.

**Why 500:** The struct lookahead already only checks 2-3 tokens ahead, so the limit is effectively a safety net. The arrow function lookahead scans to find matching parens, which in valid code is bounded by parameter count. 500 tokens covers any realistic parameter list.

Note: `looksLikeStructConstruction()` already has bounded lookahead (checks at most 3 tokens) so the limit is mainly needed for `looksLikeArrowFunction()`.

### 4. Token caching in document state

**Decision:** Add a `tokens: Token[]` field to the document state map. Compute tokens once in `analyzeDocument()` and pass them to providers.

**Impact on provider signatures:** Providers that currently accept `source: string` and call `tokenize()` internally will instead accept `tokens: Token[]` (or both `source` and `tokens`). Affected: `hover.ts`, `definition.ts`, `references.ts`, `rename.ts`, `signatureHelp.ts`, `semanticTokens.ts`.

**Alternative considered:** Lazy tokenization with a getter. Rejected as unnecessary complexity — `analyzeDocument` always runs before any provider call.

### 5. Shared formatTypeNode

**Decision:** Export `formatTypeNode()` and `formatSignature()` from `symbols.ts` (where the most complete versions live). Remove duplicate implementations from `signatureHelp.ts` and `documentSymbols.ts`, importing from `symbols.ts` instead.

**Why not a new `format.ts`:** The `symbols.ts` version is already the most complete and has no additional dependencies. Moving it to a new file would add a file without reducing coupling.

### 6. Error logging in parser catch blocks

**Decision:** Add `connection.console.log()` calls in the two parser catch blocks (body parsing at line 1021 and statement recovery at line 1097). Log the error message and current parser position.

**Note:** Since the parser is a standalone module without access to the LSP connection, we'll use `console.error()` guarded by an environment check, or simply log the error details to the `errors` array as additional parse errors.

**Revised decision:** Push a parse error into `this.errors` in each catch block with a descriptive message including the caught exception's message (if available). This keeps the parser self-contained and makes the errors visible through existing diagnostics.

## Risks / Trade-offs

- **Depth limit may reject valid code** → Mitigated by choosing 200, far beyond practical nesting. If a real case is found, the limit is easy to raise.
- **Token caching increases memory per document** → Tokens for a typical smart contract are ~10-50 KB. Negligible compared to AST and scope tree already stored.
- **Changing provider signatures is a wide change** → All six providers and their tests need updates, but the change is mechanical (add parameter, remove `tokenize()` call).
- **Exposing formatTypeNode from symbols.ts** → Slightly widens the public API of symbols.ts, but this function is already effectively public through its duplicated usage pattern.
