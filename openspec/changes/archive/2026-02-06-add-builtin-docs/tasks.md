## 1. Documentation Registry

- [x] 1.1 Create `server/src/builtinDocs.ts` with `BUILTIN_DOCS: Record<string, string>` mapping all 32 built-in names to single-sentence descriptions

## 2. Symbol Table Integration

- [x] 2.1 Add optional `documentation?: string` field to `SymbolInfo` interface in `symbols.ts`
- [x] 2.2 Populate `documentation` from `BUILTIN_DOCS` during `createRootScope()` for built-in types, functions, and ledger ADT types

## 3. Hover Provider

- [x] 3.1 Update `HoverResult` to include optional `documentation` field
- [x] 3.2 Populate `documentation` from the resolved symbol's `documentation` field
- [x] 3.3 Update `server.ts` hover handler to append documentation as markdown text below the code block

## 4. Completion Provider

- [x] 4.1 Add optional `documentation` field to `CompletionItem` in `completion.ts`
- [x] 4.2 Populate `documentation` from the symbol's `documentation` field
- [x] 4.3 Update `server.ts` completion handler to pass documentation as `MarkupContent` on LSP `CompletionItem`

## 5. Signature Help Provider

- [x] 5.1 Add optional `documentation` field to `SignatureHelpResult` in `signatureHelp.ts`
- [x] 5.2 Populate `documentation` from the resolved symbol's `documentation` field
- [x] 5.3 Update `server.ts` signature help handler to pass documentation as `MarkupContent` on `SignatureInformation`

## 6. Tests

- [x] 6.1 Add tests for `builtinDocs.ts` — verify all 34 built-ins have non-empty descriptions
- [x] 6.2 Add hover tests — built-in with docs returns documentation, user-defined without docs does not
- [x] 6.3 Add completion tests — built-in items include documentation, user-defined do not
- [x] 6.4 Add signature help tests — built-in function call includes documentation
