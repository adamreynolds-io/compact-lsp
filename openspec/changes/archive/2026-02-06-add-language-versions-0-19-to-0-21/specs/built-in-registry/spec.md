## ADDED Requirements

### Requirement: Root scope registers version-specific NativePoint identifiers
When the resolved effective version is 0.19.0 or later, the root scope SHALL include `NativePoint` as an ADT type. When the resolved version is 0.19.0, the root scope SHALL include `NativePointX` and `NativePointY` as built-in functions. When the resolved version is 0.20.0 or later, the root scope SHALL include `nativePointX`, `nativePointY`, and `constructNativePoint` as built-in functions instead. When the resolved version is 0.18.0, the root scope SHALL include `CurvePoint` as an ADT type.

#### Scenario: Completion at version 0.18.0 includes CurvePoint
- **WHEN** a file declares `pragma language_version 0.18.0;` and the user triggers completion
- **THEN** `CurvePoint` appears in the completion list as a built-in type
- **AND** `NativePoint` does NOT appear

#### Scenario: Completion at version 0.19.0 includes NativePoint and uppercase accessors
- **WHEN** a file declares `pragma language_version 0.19.0;` and the user triggers completion
- **THEN** `NativePoint` appears as a built-in type
- **AND** `NativePointX` and `NativePointY` appear as built-in functions
- **AND** `CurvePoint` does NOT appear

#### Scenario: Completion at version 0.20.0 includes lowercase accessors and constructor
- **WHEN** a file declares `pragma language_version 0.20.0;` and the user triggers completion
- **THEN** `NativePoint` appears as a built-in type
- **AND** `nativePointX`, `nativePointY`, and `constructNativePoint` appear as built-in functions
- **AND** `NativePointX` and `NativePointY` do NOT appear

#### Scenario: Completion at version 0.21.0 matches 0.20.0
- **WHEN** a file declares `pragma language_version 0.21.0;` and the user triggers completion
- **THEN** the set of built-in types and functions is identical to version 0.20.0

#### Scenario: Hover on NativePoint shows documentation
- **WHEN** a file declares `pragma language_version >= 0.19.0;` and the user hovers over `NativePoint`
- **THEN** hover displays the type information and documentation for NativePoint

#### Scenario: No version pragma includes all built-ins
- **WHEN** a file has no pragma and the user triggers completion
- **THEN** both `NativePoint` and `CurvePoint` appear (all built-ins from all versions)
- **AND** both `nativePointX`/`nativePointY` and `NativePointX`/`NativePointY` appear
