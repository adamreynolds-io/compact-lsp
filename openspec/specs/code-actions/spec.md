### Requirement: Server registers code action capability
The server SHALL register `codeActionProvider` in its capabilities during initialization, supporting `CodeActionKind.QuickFix` and `CodeActionKind.Refactor`.

#### Scenario: Client receives code action capability
- **WHEN** the LSP client sends `initialize`
- **THEN** the server response includes `codeActionProvider` with `codeActionKinds` containing `"quickfix"` and `"refactor"`

### Requirement: Quick fix for undefined reference adds import
When a diagnostic with code `"undefined-reference"` is present and a workspace module exports a symbol with the matching name, the server SHALL offer a quick fix to add an import statement.

#### Scenario: Single matching export in workspace
- **WHEN** the cursor is on a diagnostic `'foo' is not defined`
- **AND** workspace module `Utils` exports `foo`
- **THEN** a code action is offered with title `Add import of 'foo' from Utils`
- **AND** the action inserts `import { foo } from Utils;` at the top of the file (after existing imports)

#### Scenario: Multiple matching exports in workspace
- **WHEN** the cursor is on a diagnostic `'bar' is not defined`
- **AND** workspace modules `ModA` and `ModB` both export `bar`
- **THEN** one code action is offered per matching module

#### Scenario: No matching exports
- **WHEN** the cursor is on a diagnostic `'baz' is not defined`
- **AND** no workspace module exports `baz`
- **THEN** no quick fix code action is offered for this diagnostic

### Requirement: Quick fix for specifier not exported removes specifier
When a diagnostic with code `"specifier-not-exported"` is present, the server SHALL offer a quick fix to remove the invalid specifier from the import statement.

#### Scenario: Import has multiple specifiers and one is invalid
- **WHEN** the file has `import { valid, invalid } from Mod;`
- **AND** diagnostic `Module 'Mod' does not export 'invalid'` is on `invalid`
- **THEN** a code action is offered with title `Remove 'invalid' from import`
- **AND** the action edits the import to `import { valid } from Mod;`

#### Scenario: Import has only the invalid specifier
- **WHEN** the file has `import { invalid } from Mod;`
- **AND** diagnostic `Module 'Mod' does not export 'invalid'` is on `invalid`
- **THEN** a code action is offered that removes the entire import declaration

### Requirement: Quick fix for module not found suggests similar names
When a diagnostic with code `"module-not-found"` is present, the server SHALL offer a quick fix if a similar module name exists in the workspace.

#### Scenario: Typo in module name with close match
- **WHEN** the file has `import { x } from Utlis;`
- **AND** diagnostic `Module 'Utlis' not found` is present
- **AND** workspace has a module named `Utils`
- **THEN** a code action is offered with title `Did you mean 'Utils'?`
- **AND** the action replaces the module name in the import

#### Scenario: No similar module name
- **WHEN** the file has `import { x } from Nonexistent;`
- **AND** no similar module name exists in the workspace
- **THEN** no quick fix is offered for this diagnostic

### Requirement: Refactoring action to extract expression to const
The server SHALL offer a refactoring action to extract a selected expression into a `const` declaration when the selection covers a valid expression range.

#### Scenario: User selects an expression in a circuit body
- **WHEN** the user selects an expression like `a + b * c` within a circuit body
- **THEN** a code action is offered with title `Extract to const`
- **AND** the action inserts `const extracted = a + b * c;` before the containing statement
- **AND** replaces the selected expression with `extracted`

#### Scenario: User selection does not cover a valid expression
- **WHEN** the user selects partial text that does not correspond to a complete expression
- **THEN** no extract-to-const action is offered

### Requirement: Refactoring action to remove unused import specifier
The server SHALL offer a refactoring action to remove an import specifier that has no references in the file.

#### Scenario: Unused specifier among used ones
- **WHEN** the file has `import { used, unused } from Mod;`
- **AND** `used` has references in the file but `unused` does not
- **AND** the cursor is on the `unused` specifier
- **THEN** a code action is offered with title `Remove unused import 'unused'`
- **AND** the action edits the import to `import { used } from Mod;`

#### Scenario: All specifiers used
- **WHEN** the cursor is on an import specifier that has references in the file
- **THEN** no remove-unused-import action is offered

### Requirement: Code action provider follows existing provider pattern
The code action provider SHALL be implemented as a pure function in `server/src/codeActions.ts` accepting `parseResult`, `fileScope`, `references`, `tokens`, `diagnostics`, `range`, `source`, and optional `workspaceIndex`, returning `CodeActionResult[]`.

#### Scenario: Provider called without workspace index
- **WHEN** `getCodeActions()` is called without a `workspaceIndex`
- **THEN** import-related quick fixes are not offered
- **AND** non-import actions (extract to const, remove unused import) still work

#### Scenario: Provider called with empty diagnostics
- **WHEN** `getCodeActions()` is called with an empty diagnostics array
- **THEN** only refactoring actions are evaluated (no quick fixes)

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
