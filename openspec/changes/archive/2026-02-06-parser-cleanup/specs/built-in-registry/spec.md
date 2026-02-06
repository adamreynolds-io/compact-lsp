## ADDED Requirements

### Requirement: Version registry uses delta-based definitions
The version registry SHALL define versions as an ordered chain of deltas. The first entry (baseline) SHALL list all built-in types, functions, and ADT types. Subsequent entries SHALL declare only additions and removals relative to the previous version. The registry SHALL compute and cache the full `VersionCapabilities` for each version at module load time.

#### Scenario: Adding a new version with no changes
- **WHEN** a new version entry is added with no additions or removals
- **THEN** the computed capabilities are identical to the previous version

#### Scenario: Adding a new version with additions
- **WHEN** a new version entry adds `newFunc` to built-in functions
- **THEN** the computed capabilities include all previous functions plus `newFunc`

#### Scenario: Adding a new version with removals
- **WHEN** a new version entry removes `oldFunc` from built-in functions
- **THEN** the computed capabilities include all previous functions except `oldFunc`

#### Scenario: Adding a new version with both additions and removals
- **WHEN** a new version entry adds `newFunc` and removes `oldFunc`
- **THEN** the computed capabilities include `newFunc` but not `oldFunc`

#### Scenario: Computed capabilities match previous full arrays
- **WHEN** the delta chain is computed for all existing versions
- **THEN** each version's computed capabilities are identical to the previously hardcoded full arrays

### Requirement: Registry exposes union of all built-ins
The version registry SHALL export a function that returns the union of all built-in names across every version. This union SHALL be used as the fallback when no pragma version is declared.

#### Scenario: Union includes current and removed built-ins
- **WHEN** the union is computed
- **THEN** it includes both `CurvePoint` (removed in 0.19.0) and `NativePoint` (added in 0.19.0)
- **AND** it includes both `NativePointX` (removed in 0.20.0) and `nativePointX` (added in 0.20.0)

#### Scenario: No-version fallback uses union
- **WHEN** `createRootScope()` is called without an effective version
- **THEN** it registers all built-ins from the union (same behavior as before)

## MODIFIED Requirements

### Requirement: Root scope registers comprehensive built-in functions
The symbol table's root scope SHALL include all Compact built-in functions with their signatures: `map`, `fold`, `pad`, `slice`, `disclose`, `default`, `transientHash`, `transientCommit`, `persistentHash`, `persistentCommit`, `degradeToTransient`, `upgradeFromTransient`, `ecAdd`, `ecMul`, `ecMulGenerator`, `hashToCurve`, `ownPublicKey`, `createZswapInput`, `createZswapOutput`. The set of built-in functions SHALL be derived from the version registry, not from a separate hardcoded array.

#### Scenario: Built-in function completion
- **WHEN** the user triggers completion in a circuit body
- **THEN** all built-in functions appear in the completion list with their parameter signatures

#### Scenario: Built-in function hover
- **WHEN** the user hovers over `disclose` in `disclose(value)`
- **THEN** hover displays the function signature including parameter types and return type

#### Scenario: Built-in function signature help
- **WHEN** the user types `pad(` to trigger signature help
- **THEN** signature help displays the parameter list for `pad`

#### Scenario: No duplicate built-in arrays in symbols module
- **WHEN** the symbols module registers built-ins for the no-version fallback
- **THEN** it obtains the built-in names from the version registry, not from locally defined arrays
