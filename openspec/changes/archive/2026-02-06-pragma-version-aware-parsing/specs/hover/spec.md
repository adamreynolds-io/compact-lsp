## ADDED Requirements

### Requirement: Hover shows version info for pragma language_version
The hover provider SHALL return version information when the cursor is on a `pragma language_version` declaration line. The hover content SHALL show the declared version string and whether it is a supported version.

#### Scenario: Hover over supported pragma language_version
- **WHEN** the cursor is on a `pragma language_version 0.14.0;` line and `0.14.0` is a supported version
- **THEN** hover returns content indicating the language version `0.14.0` and that it is supported

#### Scenario: Hover over unsupported pragma language_version
- **WHEN** the cursor is on a `pragma language_version 99.0.0;` line and `99.0.0` is not a supported version
- **THEN** hover returns content indicating the language version `99.0.0` and that it is not recognized

#### Scenario: Hover over non-version pragma
- **WHEN** the cursor is on a `pragma other_thing 1.0;` line
- **THEN** hover returns no result (no special handling for non-version pragmas)
