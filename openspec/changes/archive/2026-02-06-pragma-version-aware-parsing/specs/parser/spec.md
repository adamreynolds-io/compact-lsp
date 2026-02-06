## MODIFIED Requirements

### Requirement: Parser produces AST for top-level declarations
The parser SHALL parse top-level Compact declarations into an AST with typed nodes, preserving source positions on each node. The `SourceFile` node SHALL include optional `languageVersion` and `languageVersionOperator` fields extracted from the first `pragma language_version` declaration. The operator SHALL be `"="` for exact versions and `">="` for `>=` prefixed versions.

#### Scenario: Circuit definition
- **WHEN** the source contains `circuit add(x: Field, y: Field) : Field { ... }`
- **THEN** the AST contains a `CircuitDefinition` node with name `add`, parameters, return type, and modifiers

#### Scenario: Pragma with exact version
- **WHEN** the source contains `pragma language_version 0.14.0;`
- **THEN** the AST contains a `Pragma` node
- **AND** the `SourceFile` node has `languageVersion` set to `"0.14.0"` and `languageVersionOperator` set to `"="`

#### Scenario: Pragma with >= version
- **WHEN** the source contains `pragma language_version >= 0.14.0;`
- **THEN** the AST contains a `Pragma` node
- **AND** the `SourceFile` node has `languageVersion` set to `"0.14.0"` and `languageVersionOperator` set to `">="`

#### Scenario: Pragma with non-version name
- **WHEN** the source contains `pragma other_setting value;`
- **THEN** the AST contains a `Pragma` node
- **AND** the `SourceFile` node has `languageVersion` unchanged (remains `undefined` if no language_version pragma exists)
