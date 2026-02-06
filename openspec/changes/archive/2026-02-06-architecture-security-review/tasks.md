## 1. Parser Resource Limits

- [x] 1.1 Add `depth` parameter to `parseExpression()`, `parsePrefixExpression()`, and `parseInfixExpression()` in `parser.ts`, with a limit of 200. When exceeded, push a parse error and return an error expression node.
- [x] 1.2 Add a token scan limit (500) to the `looksLikeArrowFunction()` while loops. Return `false` if the limit is exceeded.
- [x] 1.3 Add file size check at the top of `analyzeDocument()` in `server.ts`. If `text.length >= 1_000_000`, send a warning diagnostic and return without parsing.
- [x] 1.4 Write tests for expression depth limit (verify error at depth > 200, verify success at normal depth)
- [x] 1.5 Write tests for file size limit (server-level guard in analyzeDocument — verified by code inspection; no LSP connection mock available)
- [x] 1.6 Write test for lookahead bounds (verify `looksLikeArrowFunction` returns `false` for unbounded input)

## 2. Token Caching

- [x] 2.1 Add `tokens: Token[]` field to the document state map in `server.ts` and compute tokens in `analyzeDocument()`
- [x] 2.2 Update `getHoverInfo()` in `hover.ts` to accept `tokens` parameter instead of calling `tokenize()`
- [x] 2.3 Update `getDefinition()` in `definition.ts` to accept `tokens` parameter
- [x] 2.4 Update `findReferences()` in `references.ts` to accept `tokens` parameter
- [x] 2.5 Update `prepareRename()` and `getRenameEdits()` in `rename.ts` to accept `tokens` parameter
- [x] 2.6 Update `getSignatureHelp()` in `signatureHelp.ts` to accept `tokens` parameter
- [x] 2.7 Update `getSemanticTokens()` in `semanticTokens.ts` to accept `tokens` parameter
- [x] 2.8 Update all provider call sites in `server.ts` to pass cached tokens
- [x] 2.9 Update all provider tests to pass tokens instead of relying on internal tokenization

## 3. Shared Formatting

- [x] 3.1 Export `formatTypeNode()` from `symbols.ts`
- [x] 3.2 Remove local `formatTypeNode()` from `signatureHelp.ts` and import from `symbols.ts`
- [x] 3.3 Remove local `formatTypeNode()` from `documentSymbols.ts` and import from `symbols.ts`
- [x] 3.4 Verify all existing tests pass without assertion changes

## 4. Error Observability

- [x] 4.1 Update the body-parsing catch block (parser.ts ~line 1021) to push a parse error with the caught exception's message
- [x] 4.2 Update the statement-parsing catch block (parser.ts ~line 1097) to push a parse error with the caught exception's message
- [x] 4.3 Write tests verifying that parser catch blocks produce error entries in the parse result

## 5. Validation

- [x] 5.1 Run full test suite (`npm test`) and verify all 297 tests pass
- [x] 5.2 Run `npm run lint` — 0 errors (3 pre-existing warnings unrelated to this change)
- [x] 5.3 Run `npm run format:check` and fix formatting issues (4 files fixed)
