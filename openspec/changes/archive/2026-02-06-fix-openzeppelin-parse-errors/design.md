## Context

The OpenZeppelin compact-contracts repository is the primary real-world Compact codebase. Testing against it revealed two parser/lexer bugs:

1. **String literal type arguments** (`Opaque<"CoinInfo">`) — `parseParameterizedType()` calls `parseType()` for non-number tokens, but `parseType()` → `expectTypeName()` doesn't recognize `StringLiteral`, pushes an error, and returns `'<missing>'` without advancing the token position → infinite loop → OOM crash. Affects 4 of 9 contracts (Utils, FungibleToken, MultiToken, NonFungibleToken).

2. **Block comments** (`/* */`, `/** */`) — the lexer only handles `//` line comments. Block comment characters tokenize as `Unknown` (`/`), `Star` (`*`), and the comment body as identifiers/keywords, producing ErrorNodes. Affects all 9 contracts since they all use JSDoc-style comments.

## Goals / Non-Goals

**Goals:**
- Parse `Opaque<"string">` and similar string-literal type arguments without crashing
- Skip block comments (`/* */` and `/** */`) in the lexer
- Add a safety guard to prevent future infinite loops in type argument parsing
- Display string type arguments correctly in hover/completion

**Non-Goals:**
- Generic type arguments in expression position (`default<Type>`, `left<T, U>(...)`) — separate feature
- Preserving block comment content for doc-comment extraction — future enhancement
- Parsing all OZ contracts with 0 errors — some require expression-position generics

## Decisions

**1. New `StringArgument` AST node rather than reusing `LiteralExpression`**

Type arguments have their own union (`TypeArgument = TypeNode | NumberArgument | RangeArgument`). Adding `StringArgument` follows the existing pattern rather than mixing expression nodes into the type system. This keeps the type argument handling self-contained.

**2. Safety guard via position check rather than token-kind whitelist**

Rather than maintaining a list of "valid" tokens inside `parseParameterizedType()`, we check if the parser position advanced after each iteration. If not, force-advance. This catches any future unhandled token type without needing explicit handling for each.

**3. Block comments handled in lexer (skip entirely) rather than parser**

Block comments are lexical, not syntactic. Skipping them in the lexer means no parser changes needed and no comment tokens in the stream. This is consistent with how line comments are already handled.

## Risks / Trade-offs

- **Unterminated block comments** → The lexer consumes to EOF without error. This silently eats source code. Acceptable for now since the parser will report errors for the missing declarations. A future enhancement could emit a diagnostic.
- **Safety guard masks bugs** → Force-advancing on no-progress means the parser won't hang, but the underlying unhandled token type produces an error and skips silently. This is better than OOM but could produce confusing error messages. Acceptable trade-off.
- **No comment content preservation** → JSDoc content is lost. A future doc-comment feature would need to revisit the lexer to capture `/** */` content. The current approach doesn't preclude this.
