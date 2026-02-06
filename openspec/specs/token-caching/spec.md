## ADDED Requirements

### Requirement: Cached tokens in document state
The server SHALL cache the tokenization result in the per-document state map. Tokens SHALL be computed once during `analyzeDocument()` and reused across all provider calls for that document version.

#### Scenario: Tokens computed during analysis
- **WHEN** a document is opened or changed
- **THEN** the server SHALL call `tokenize()` once and store the resulting tokens in document state alongside the parse result, scope, and references

#### Scenario: Provider uses cached tokens
- **WHEN** a provider (hover, definition, references, rename, signatureHelp, semanticTokens) handles a request
- **THEN** the provider SHALL use the cached tokens from document state
- **AND** the provider SHALL NOT call `tokenize()` independently

### Requirement: Provider signature update
Providers that currently accept `source: string` and tokenize internally SHALL accept pre-computed tokens. The providers affected are: hover, definition, references, rename, signatureHelp, and semanticTokens.

#### Scenario: Hover provider accepts tokens
- **WHEN** `getHoverInfo()` is called
- **THEN** it SHALL accept a `tokens` parameter and use it instead of calling `tokenize()`

#### Scenario: All affected providers accept tokens
- **WHEN** any of `getHoverInfo`, `getDefinition`, `findReferences`, `prepareRename`, `getRenameEdits`, `getSignatureHelp`, or `getSemanticTokens` is called
- **THEN** each SHALL accept a `tokens` parameter and not perform independent tokenization
