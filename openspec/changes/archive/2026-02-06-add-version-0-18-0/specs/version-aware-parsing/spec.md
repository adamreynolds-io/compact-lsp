## MODIFIED Requirements

### Requirement: Version registry defines supported versions
A version registry SHALL define the set of supported Compact language versions. Each version entry SHALL include: the version string, the set of built-in type names, the set of built-in function names, and the set of built-in ADT type names available in that version. The registry SHALL contain entries for versions `"0.14.0"` and `"0.18.0"`.

#### Scenario: Registry contains 0.18.0
- **WHEN** the version registry is queried for `"0.18.0"`
- **THEN** it returns a valid entry

#### Scenario: 0.18.0 includes all 0.14.0 built-in types
- **WHEN** the registry entry for `"0.18.0"` is queried
- **THEN** it includes built-in types `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`

#### Scenario: 0.18.0 includes new built-in functions
- **WHEN** the registry entry for `"0.18.0"` is queried
- **THEN** it includes all 0.14.0 built-in functions plus `left`, `right`, `burnAddress`

#### Scenario: 0.18.0 includes new ADT types
- **WHEN** the registry entry for `"0.18.0"` is queried
- **THEN** it includes all 0.14.0 ADT types plus `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`

#### Scenario: >= 0.18.0 resolves exactly
- **WHEN** a file declares `pragma language_version >= 0.18.0;`
- **THEN** the effective version is `"0.18.0"` with no fallback diagnostic

#### Scenario: >= 0.15.0 falls back to 0.18.0
- **WHEN** a file declares `pragma language_version >= 0.15.0;` and the registry contains `0.14.0` and `0.18.0`
- **THEN** the effective version is `"0.18.0"` (next highest above `0.15.0`) with a `version-resolved` informational diagnostic

#### Scenario: New built-ins have documentation
- **WHEN** the built-in documentation is queried for `left`, `right`, `burnAddress`, `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`
- **THEN** each has a non-empty documentation string
