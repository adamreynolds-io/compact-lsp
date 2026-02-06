## ADDED Requirements

### Requirement: Single source of truth for formatTypeNode
The `formatTypeNode()` function SHALL be defined in exactly one location (`symbols.ts`) and exported for use by other modules. The duplicate implementations in `signatureHelp.ts` and `documentSymbols.ts` SHALL be removed and replaced with imports.

#### Scenario: signatureHelp uses shared formatTypeNode
- **WHEN** `signatureHelp.ts` needs to format a type node
- **THEN** it SHALL import and call `formatTypeNode` from `symbols.ts`
- **AND** it SHALL NOT define its own local `formatTypeNode` function

#### Scenario: documentSymbols uses shared formatTypeNode
- **WHEN** `documentSymbols.ts` needs to format a type node
- **THEN** it SHALL import and call `formatTypeNode` from `symbols.ts`
- **AND** it SHALL NOT define its own local `formatTypeNode` function

#### Scenario: Formatting behavior is preserved
- **WHEN** `formatTypeNode` is called with any TypeNode
- **THEN** the output SHALL be identical to the current behavior in each module
- **AND** all existing tests SHALL continue to pass without modification to assertions
