## ADDED Requirements

### Requirement: Documentation registry covers all version registry built-ins
Every built-in name that appears in any version's capabilities (types, functions, ADT types) SHALL have a corresponding entry in the documentation registry. A test SHALL validate this by iterating the union of all built-ins from the version registry and asserting each has a non-empty documentation string.

#### Scenario: All version registry built-ins have documentation
- **WHEN** the union of all built-in names across all versions is computed
- **THEN** every name has a corresponding non-empty entry in `BUILTIN_DOCS`

#### Scenario: New built-in added to version registry without docs
- **WHEN** a developer adds a new built-in name to the version registry but not to `BUILTIN_DOCS`
- **THEN** the completeness test fails, identifying the missing entry
