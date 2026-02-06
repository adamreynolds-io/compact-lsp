## ADDED Requirements

### Requirement: Identifier module name resolution
The module resolver SHALL resolve identifier module names by searching the workspace index for a file whose module name matches.

#### Scenario: Module name matches explicit module declaration
- **WHEN** the import references `MyModule` and a file declares `module MyModule { ... }`
- **THEN** the resolver returns that file's URI

#### Scenario: Module name matches file stem
- **WHEN** the import references `utils` and a file named `utils.compact` exists (with no explicit module declaration)
- **THEN** the resolver returns that file's URI

#### Scenario: Module declaration takes priority over file stem
- **WHEN** `helpers.compact` declares `module Helpers { ... }` and another file is named `Helpers.compact`
- **THEN** the resolver returns `helpers.compact` (explicit module declaration wins)

#### Scenario: No matching module
- **WHEN** the import references `NonExistent` and no file has that module name
- **THEN** the resolver returns undefined

### Requirement: String-path module resolution
The module resolver SHALL resolve string-path imports relative to the importing file's directory.

#### Scenario: Relative path import
- **WHEN** file `/project/src/main.compact` contains `import "utils/helpers" prefix H$;`
- **THEN** the resolver looks for `/project/src/utils/helpers.compact`

#### Scenario: Path with extension
- **WHEN** the import path already ends with `.compact`
- **THEN** the resolver uses the path as-is without appending `.compact`

#### Scenario: Path not found
- **WHEN** the resolved path does not exist in the workspace index
- **THEN** the resolver returns undefined
