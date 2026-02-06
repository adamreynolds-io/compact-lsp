### Requirement: Unused import specifiers produce warnings
The lint diagnostics provider SHALL report a warning for each import specifier that has no references in the file. The diagnostic SHALL have code `"unused-import"` and severity `warning`.

#### Scenario: Import specifier never referenced
- **WHEN** the file has `import { foo } from Mod;` and `foo` is never used in the file
- **THEN** a diagnostic with code `"unused-import"` and severity `warning` is reported on the specifier range
- **AND** the message is `'foo' is imported but never used`

#### Scenario: Import specifier is referenced
- **WHEN** the file has `import { foo } from Mod;` and `foo` is used in a circuit body
- **THEN** no unused-import diagnostic is reported for `foo`

#### Scenario: Aliased import specifier unused
- **WHEN** the file has `import { foo as bar } from Mod;` and `bar` is never used
- **THEN** a diagnostic with code `"unused-import"` is reported with message `'bar' is imported but never used`

#### Scenario: One specifier used, another unused
- **WHEN** the file has `import { used, unused } from Mod;` and only `used` is referenced
- **THEN** a diagnostic is reported only for `unused`, not for `used`

#### Scenario: Non-selective import produces no warning
- **WHEN** the file has `import CompactStandardLibrary;` (no specifiers)
- **THEN** no unused-import diagnostic is reported

### Requirement: Unused const variables produce warnings
The lint diagnostics provider SHALL report a warning for each `const` declaration whose name has no references after its declaration. The diagnostic SHALL have code `"unused-variable"` and severity `warning`.

#### Scenario: Const never referenced
- **WHEN** a circuit body contains `const x = 42;` and `x` is never used
- **THEN** a diagnostic with code `"unused-variable"` and severity `warning` is reported on the const declaration range
- **AND** the message is `'x' is declared but never used`

#### Scenario: Const is referenced
- **WHEN** a circuit body contains `const x = 42;` and `x` is used in a subsequent expression
- **THEN** no unused-variable diagnostic is reported for `x`

#### Scenario: Variable named underscore is excluded
- **WHEN** a circuit body contains `const _ = someExpr;` and `_` is never used
- **THEN** no unused-variable diagnostic is reported

### Requirement: Unused circuit parameters produce warnings
The lint diagnostics provider SHALL report a warning for each circuit parameter that has no references within the circuit body. The diagnostic SHALL have code `"unused-parameter"` and severity `warning`.

#### Scenario: Circuit parameter never referenced
- **WHEN** `circuit foo(x: Field, y: Field) : Field { return x; }` declares parameters `x` and `y`
- **AND** `y` is never referenced in the body
- **THEN** a diagnostic with code `"unused-parameter"` and severity `warning` is reported for `y`
- **AND** the message is `'y' is declared but never used`

#### Scenario: All parameters referenced
- **WHEN** `circuit foo(x: Field, y: Field) : Field { return x + y; }` uses both parameters
- **THEN** no unused-parameter diagnostics are reported

#### Scenario: Witness parameters are excluded
- **WHEN** `witness secret(x: Field) : Boolean;` declares parameter `x`
- **THEN** no unused-parameter diagnostic is reported (witness bodies are external)

#### Scenario: Parameter named underscore is excluded
- **WHEN** `circuit foo(_: Field) : Field { return 0; }` has parameter `_`
- **THEN** no unused-parameter diagnostic is reported

### Requirement: Unreachable code produces warnings
The lint diagnostics provider SHALL report a warning for statements that appear after a `return` statement in the same block. The diagnostic SHALL have code `"unreachable-code"` and severity `warning`.

#### Scenario: Statement after return in circuit body
- **WHEN** a circuit body contains `return x; const y = 1;`
- **THEN** a diagnostic with code `"unreachable-code"` and severity `warning` is reported on `const y = 1;`
- **AND** the message is `Unreachable code after return statement`

#### Scenario: Multiple statements after return
- **WHEN** a circuit body contains `return x; const a = 1; const b = 2;`
- **THEN** a single diagnostic is reported covering the range from the first unreachable statement to the last

#### Scenario: Return in nested block does not affect outer
- **WHEN** a circuit body contains `if (c) { return x; } const y = 1;`
- **THEN** no unreachable-code diagnostic is reported for `const y = 1;` (return is in a nested block)

#### Scenario: No return in block
- **WHEN** a circuit body contains only non-return statements
- **THEN** no unreachable-code diagnostic is reported

### Requirement: Lint diagnostics provider follows existing provider pattern
The lint diagnostics provider SHALL be implemented as a pure function in `server/src/lintDiagnostics.ts` accepting `sourceFile`, `fileScope`, and `references`, returning `Diagnostic[]`.

#### Scenario: Provider called with no declarations
- **WHEN** the source file has no declarations
- **THEN** the provider returns an empty array

#### Scenario: Provider returns only warnings
- **WHEN** the provider detects lint issues
- **THEN** all returned diagnostics have severity `warning`

### Requirement: Built-in symbols are excluded from unused checks
The lint diagnostics provider SHALL NOT report unused warnings for symbols whose kind is `"builtin-type"` or `"builtin-function"`.

#### Scenario: Built-in type not flagged
- **WHEN** `Field` is registered in root scope but never explicitly referenced
- **THEN** no unused diagnostic is reported for `Field`
