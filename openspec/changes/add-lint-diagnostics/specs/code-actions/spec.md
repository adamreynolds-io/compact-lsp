## ADDED Requirements

### Requirement: Quick fix for unused import warning removes specifier
When a diagnostic with code `"unused-import"` is present, the server SHALL offer a quick fix to remove the unused specifier from the import statement.

#### Scenario: Unused import with multiple specifiers
- **WHEN** the cursor is on a diagnostic with code `"unused-import"` for specifier `unused`
- **AND** the import is `import { used, unused } from Mod;`
- **THEN** a code action is offered with title `Remove unused import 'unused'`
- **AND** the action edits the import to `import { used } from Mod;`

#### Scenario: Unused import as only specifier
- **WHEN** the cursor is on a diagnostic with code `"unused-import"` for specifier `unused`
- **AND** the import is `import { unused } from Mod;`
- **THEN** a code action is offered that removes the entire import declaration

#### Scenario: No unused-import diagnostic
- **WHEN** the cursor is on an import specifier that has no `"unused-import"` diagnostic
- **THEN** no quick fix for unused import is offered from the lint diagnostic
