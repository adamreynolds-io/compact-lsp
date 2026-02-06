## 1. Version Registry

- [x] 1.1 Add `CurvePoint` to the 0.18.0 `builtinAdtTypes` array in `versionRegistry.ts`
- [x] 1.2 Add version entry for 0.19.0: same types as 0.18.0, replace `CurvePoint` with `NativePoint` in ADTs, add `NativePointX` and `NativePointY` to functions
- [x] 1.3 Add version entry for 0.20.0: same as 0.19.0 but replace `NativePointX`/`NativePointY` with `nativePointX`/`nativePointY` and add `constructNativePoint`
- [x] 1.4 Add version entry for 0.21.0: identical capabilities to 0.20.0

## 2. Built-in Documentation

- [x] 2.1 Add doc entry for `CurvePoint` in `builtinDocs.ts`
- [x] 2.2 Add doc entries for `NativePoint`, `NativePointX`, `NativePointY`, `nativePointX`, `nativePointY`, `constructNativePoint` in `builtinDocs.ts`

## 3. Tests

- [x] 3.1 Add version registry tests for 0.19.0 entry (ADT types include NativePoint, functions include NativePointX/Y)
- [x] 3.2 Add version registry tests for 0.20.0 entry (functions include nativePointX/Y and constructNativePoint, no uppercase accessors)
- [x] 3.3 Add version registry tests for 0.21.0 entry (identical capabilities to 0.20.0)
- [x] 3.4 Add version resolution tests: `>= 0.19.0`, `>= 0.20.0`, `>= 0.21.0` resolve exactly
- [x] 3.5 Update `builtinDocs.test.ts` pragma from `0.18.0` to `0.21.0` so all new docs are tested in root scope
- [x] 3.6 Add builtinDocs tests verifying all 7 new entries have non-empty documentation
- [x] 3.7 Add or update versionDiagnostics tests for 0.19.0–0.21.0 pragma scenarios

## 4. Documentation

- [x] 4.1 Update CLAUDE.md version registry section to list all 5 versions
- [x] 4.2 Update MEMORY.md registered versions and builtin docs count
