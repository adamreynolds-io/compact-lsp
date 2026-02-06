### Requirement: Language version extracted from pragma
The parser SHALL extract the `language_version` value from `PragmaDeclaration` nodes and expose it on the `SourceFile` AST node. The pragma value may be an exact version (e.g., `0.14.0`) or a version with a `>=` operator (e.g., `>= 0.14.0`). The `SourceFile` SHALL store both the raw version string and the parsed operator. Only the first `pragma language_version` declaration SHALL be used; subsequent ones SHALL be ignored.

#### Scenario: File with exact pragma language_version
- **WHEN** a file contains `pragma language_version 0.14.0;`
- **THEN** the `SourceFile` node has `languageVersion` set to `"0.14.0"` and `languageVersionOperator` set to `"="`

#### Scenario: File with >= pragma language_version
- **WHEN** a file contains `pragma language_version >= 0.14.0;`
- **THEN** the `SourceFile` node has `languageVersion` set to `"0.14.0"` and `languageVersionOperator` set to `">="`

#### Scenario: File without pragma language_version
- **WHEN** a file contains no `pragma language_version` declaration
- **THEN** the `SourceFile` node has `languageVersion` set to `undefined`

#### Scenario: File with non-language_version pragma
- **WHEN** a file contains `pragma other_thing 1.0;` but no `pragma language_version`
- **THEN** the `SourceFile` node has `languageVersion` set to `undefined`

#### Scenario: Multiple pragma language_version declarations
- **WHEN** a file contains `pragma language_version 0.14.0;` followed by `pragma language_version 0.26.0;`
- **THEN** the `SourceFile` node has `languageVersion` set to `"0.14.0"` (first wins)

### Requirement: Version registry defines supported versions
A version registry SHALL define the set of supported Compact language versions. Each version entry SHALL include: the version string, the set of built-in type names, and the set of built-in function names available in that version.

#### Scenario: Registry contains known versions
- **WHEN** the version registry is queried
- **THEN** it contains entries for at least version `"0.14.0"`

#### Scenario: Registry entry includes built-in types
- **WHEN** the registry entry for `"0.14.0"` is queried
- **THEN** it includes built-in types `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`

#### Scenario: Registry entry includes built-in functions
- **WHEN** the registry entry for `"0.14.0"` is queried
- **THEN** it includes built-in functions such as `map`, `fold`, `disclose`, `pad`, `slice`, `default`

### Requirement: Version resolution with fallback
The version resolution logic SHALL resolve a declared version to an effective version from the registry. For exact versions (`=`), the effective version is the declared version itself. For `>=` versions, the effective version is the declared version if it exists in the registry, otherwise the next highest version in the registry. If no matching version is found, resolution fails.

#### Scenario: Exact version matches registry
- **WHEN** a file declares `pragma language_version 0.14.0;` and `0.14.0` is in the registry
- **THEN** the effective version is `"0.14.0"`

#### Scenario: Exact version not in registry
- **WHEN** a file declares `pragma language_version 0.15.0;` and `0.15.0` is NOT in the registry
- **THEN** version resolution fails (no effective version)

#### Scenario: >= version matches registry exactly
- **WHEN** a file declares `pragma language_version >= 0.14.0;` and `0.14.0` is in the registry
- **THEN** the effective version is `"0.14.0"`

#### Scenario: >= version falls back to next highest
- **WHEN** a file declares `pragma language_version >= 0.15.0;` and the registry contains `0.14.0` and `0.20.0` but not `0.15.0`
- **THEN** the effective version is `"0.20.0"` (next highest above `0.15.0`)

#### Scenario: >= version with no higher version in registry
- **WHEN** a file declares `pragma language_version >= 99.0.0;` and no registry version is >= `99.0.0`
- **THEN** version resolution fails (no effective version)

### Requirement: Unsupported version produces a diagnostic
The diagnostics pipeline SHALL report a warning diagnostic when version resolution fails for a declared `pragma language_version`. When a `>=` version resolves to a different version than requested, the diagnostic pipeline SHALL report an informational diagnostic indicating which version is being used.

#### Scenario: Unknown exact version string
- **WHEN** a file contains `pragma language_version 99.99.0;`
- **THEN** a diagnostic with severity `warning` and code `"unsupported-version"` is reported on the pragma range

#### Scenario: >= version resolved to a different version
- **WHEN** a file contains `pragma language_version >= 0.15.0;` and resolution falls back to `0.20.0`
- **THEN** a diagnostic with severity `information` and code `"version-resolved"` is reported, indicating that version `0.20.0` is being used instead of `0.15.0`

#### Scenario: Known version string
- **WHEN** a file contains `pragma language_version 0.14.0;`
- **THEN** no version-related diagnostic is reported

#### Scenario: >= version matches exactly
- **WHEN** a file contains `pragma language_version >= 0.14.0;` and `0.14.0` is in the registry
- **THEN** no version-related diagnostic is reported

### Requirement: Version-gated completion suggestions
The completion provider SHALL filter built-in type and function suggestions based on the declared language version. If no version is declared, all built-ins SHALL be suggested.

#### Scenario: Completion with declared version
- **WHEN** a file declares `pragma language_version 0.14.0;` and the user triggers completion
- **THEN** only built-in types and functions defined for the effective resolved version are suggested

#### Scenario: Completion with >= version resolved to fallback
- **WHEN** a file declares `pragma language_version >= 0.15.0;` and the effective version resolves to `0.20.0`
- **THEN** built-in suggestions are filtered using the `0.20.0` capabilities

#### Scenario: Completion without declared version
- **WHEN** a file has no `pragma language_version` declaration and the user triggers completion
- **THEN** all built-in types and functions are suggested (default behavior, no filtering)
