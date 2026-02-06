## ADDED Requirements

### Requirement: Report unresolvable module
The import diagnostics SHALL report an error when an import references a module that cannot be found in the workspace.

#### Scenario: Unknown module name
- **WHEN** a file contains `import { foo } from UnknownModule;` and no file maps to `UnknownModule`
- **THEN** a diagnostic is published with severity `Error` and message `Module 'UnknownModule' not found`

#### Scenario: Unknown string-path module
- **WHEN** a file contains `import "nonexistent/file" prefix P$;` and the resolved path does not exist
- **THEN** a diagnostic is published with severity `Error` and message indicating the module path was not found

#### Scenario: Known module resolves without error
- **WHEN** a file imports from a module that exists in the workspace
- **THEN** no module-not-found diagnostic is published

### Requirement: Report unresolvable import specifier
The import diagnostics SHALL report an error when a selective import references a symbol that the resolved module does not export.

#### Scenario: Symbol not exported
- **WHEN** a file contains `import { helper } from MathUtils;` and `MathUtils` exists but does not export `helper`
- **THEN** a diagnostic is published with severity `Error` and message `Module 'MathUtils' does not export 'helper'`

#### Scenario: Symbol is exported
- **WHEN** a file contains `import { add } from MathUtils;` and `MathUtils` exports `add`
- **THEN** no diagnostic is published for that specifier

### Requirement: Suppress diagnostics for known standard library modules
The import diagnostics SHALL NOT report module-not-found errors for imports that reference known standard library module names or `include` paths.

#### Scenario: Standard library import
- **WHEN** a file contains `include "standard_library.compact";`
- **THEN** no module-not-found diagnostic is published (include is not an import)

#### Scenario: Unknown module that is not standard library
- **WHEN** a file contains `import { foo } from CustomModule;` and `CustomModule` is not found
- **THEN** a module-not-found diagnostic IS published
