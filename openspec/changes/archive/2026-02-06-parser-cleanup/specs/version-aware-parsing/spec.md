## MODIFIED Requirements

### Requirement: Version resolution with fallback
The version resolution logic SHALL resolve a declared version to an effective version from the registry. For exact versions (`=`), if the declared version exists in the registry, the effective version is the declared version itself; if not, the effective version SHALL be the latest version in the registry (fall-forward), with `fallback` set to `true`. For `>=` versions, the effective version is the declared version if it exists in the registry, otherwise the next highest version in the registry. If no matching version is found for `>=`, resolution fails.

#### Scenario: Exact version matches registry
- **WHEN** a file declares `pragma language_version 0.14.0;` and `0.14.0` is in the registry
- **THEN** the effective version is `"0.14.0"` with `fallback` set to `false`

#### Scenario: Exact version not in registry falls forward to latest
- **WHEN** a file declares `pragma language_version 0.22.0;` and `0.22.0` is NOT in the registry and the latest known version is `0.21.0`
- **THEN** the effective version is `"0.21.0"` with `fallback` set to `true`

#### Scenario: Exact version not in registry uses latest version capabilities
- **WHEN** a file declares `pragma language_version 0.22.0;` and falls forward to `0.21.0`
- **THEN** the root scope includes built-ins from `0.21.0` (e.g., `nativePointX`) but NOT removed items (e.g., `CurvePoint`, `NativePointX`)

#### Scenario: >= version matches registry exactly
- **WHEN** a file declares `pragma language_version >= 0.14.0;` and `0.14.0` is in the registry
- **THEN** the effective version is `"0.14.0"` with `fallback` set to `false`

#### Scenario: >= version falls back to next highest
- **WHEN** a file declares `pragma language_version >= 0.15.0;` and the registry contains `0.14.0` and `0.20.0` but not `0.15.0`
- **THEN** the effective version is `"0.20.0"` (next highest above `0.15.0`) with `fallback` set to `true`

#### Scenario: >= version with no higher version in registry
- **WHEN** a file declares `pragma language_version >= 99.0.0;` and no registry version is >= `99.0.0`
- **THEN** version resolution fails (no effective version)

### Requirement: Unsupported version produces a diagnostic
The diagnostics pipeline SHALL report an informational diagnostic when an exact version is not in the registry but falls forward to the latest known version. The diagnostics pipeline SHALL report a warning diagnostic only when `>=` resolution fails entirely (no version high enough). When a `>=` version resolves to a different version than requested, the diagnostic pipeline SHALL report an informational diagnostic indicating which version is being used.

#### Scenario: Unknown exact version falls forward with info diagnostic
- **WHEN** a file contains `pragma language_version 0.22.0;` and the latest known version is `0.21.0`
- **THEN** a diagnostic with severity `information` and code `"version-resolved"` is reported, indicating that version `0.21.0` is being used

#### Scenario: >= version resolved to a different version
- **WHEN** a file contains `pragma language_version >= 0.15.0;` and resolution falls back to `0.20.0`
- **THEN** a diagnostic with severity `information` and code `"version-resolved"` is reported, indicating that version `0.20.0` is being used instead of `0.15.0`

#### Scenario: >= version with no match produces warning
- **WHEN** a file contains `pragma language_version >= 99.0.0;` and no registry version is >= `99.0.0`
- **THEN** a diagnostic with severity `warning` and code `"unsupported-version"` is reported on the pragma range

#### Scenario: Known version string
- **WHEN** a file contains `pragma language_version 0.14.0;`
- **THEN** no version-related diagnostic is reported

#### Scenario: >= version matches exactly
- **WHEN** a file contains `pragma language_version >= 0.14.0;` and `0.14.0` is in the registry
- **THEN** no version-related diagnostic is reported
