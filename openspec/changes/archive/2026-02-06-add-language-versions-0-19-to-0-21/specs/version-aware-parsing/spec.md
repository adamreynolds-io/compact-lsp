## MODIFIED Requirements

### Requirement: Version registry defines supported versions
A version registry SHALL define the set of supported Compact language versions. Each version entry SHALL include: the version string, the set of built-in type names, the set of built-in function names, and the set of built-in ADT type names available in that version. The registry SHALL contain entries for versions `"0.14.0"`, `"0.18.0"`, `"0.19.0"`, `"0.20.0"`, and `"0.21.0"`.

#### Scenario: Registry contains known versions
- **WHEN** the version registry is queried
- **THEN** it contains entries for versions `"0.14.0"`, `"0.18.0"`, `"0.19.0"`, `"0.20.0"`, and `"0.21.0"`

#### Scenario: Registry entry includes built-in types
- **WHEN** the registry entry for `"0.14.0"` is queried
- **THEN** it includes built-in types `Field`, `Boolean`, `Uint`, `Bytes`, `Vector`, `Opaque`, `Void`

#### Scenario: Registry entry includes built-in functions
- **WHEN** the registry entry for `"0.14.0"` is queried
- **THEN** it includes built-in functions such as `map`, `fold`, `disclose`, `pad`, `slice`, `default`

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
- **THEN** it includes all 0.14.0 ADT types plus `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`, `CurvePoint`

#### Scenario: 0.19.0 replaces CurvePoint with NativePoint
- **WHEN** the registry entry for `"0.19.0"` is queried
- **THEN** it includes `NativePoint` in ADT types but NOT `CurvePoint`

#### Scenario: 0.19.0 includes NativePoint accessor functions
- **WHEN** the registry entry for `"0.19.0"` is queried
- **THEN** it includes all 0.18.0 built-in functions plus `NativePointX` and `NativePointY`

#### Scenario: 0.20.0 renames NativePoint accessors to lowercase
- **WHEN** the registry entry for `"0.20.0"` is queried
- **THEN** it includes `nativePointX` and `nativePointY` but NOT `NativePointX` or `NativePointY`

#### Scenario: 0.20.0 includes constructNativePoint
- **WHEN** the registry entry for `"0.20.0"` is queried
- **THEN** it includes `constructNativePoint` in built-in functions

#### Scenario: 0.21.0 has same capabilities as 0.20.0
- **WHEN** the registry entries for `"0.20.0"` and `"0.21.0"` are compared
- **THEN** they have identical built-in types, functions, and ADT types

#### Scenario: >= 0.19.0 resolves exactly
- **WHEN** a file declares `pragma language_version >= 0.19.0;`
- **THEN** the effective version is `"0.19.0"` with no fallback diagnostic

#### Scenario: >= 0.20.0 resolves exactly
- **WHEN** a file declares `pragma language_version >= 0.20.0;`
- **THEN** the effective version is `"0.20.0"` with no fallback diagnostic

#### Scenario: >= 0.21.0 resolves exactly
- **WHEN** a file declares `pragma language_version >= 0.21.0;`
- **THEN** the effective version is `"0.21.0"` with no fallback diagnostic

#### Scenario: >= 0.18.0 resolves exactly
- **WHEN** a file declares `pragma language_version >= 0.18.0;`
- **THEN** the effective version is `"0.18.0"` with no fallback diagnostic

#### Scenario: >= 0.15.0 falls back to 0.18.0
- **WHEN** a file declares `pragma language_version >= 0.15.0;` and the registry contains `0.14.0`, `0.18.0`, `0.19.0`, `0.20.0`, `0.21.0`
- **THEN** the effective version is `"0.18.0"` (next highest above `0.15.0`) with a `version-resolved` informational diagnostic

#### Scenario: New built-ins have documentation
- **WHEN** the built-in documentation is queried for `CurvePoint`, `NativePoint`, `NativePointX`, `NativePointY`, `nativePointX`, `nativePointY`, `constructNativePoint`
- **THEN** each has a non-empty documentation string
