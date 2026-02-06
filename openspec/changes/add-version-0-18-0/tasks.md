## Group 1: Version Registry

- [x] Add 0.18.0 entry to `LANGUAGE_VERSIONS` in `versionRegistry.ts` with built-in types (same as 0.14.0: Field, Boolean, Uint, Bytes, Vector, Opaque, Void), built-in functions (all 0.14.0 functions plus `left`, `right`, `burnAddress`), and ADT types (all 0.14.0 ADTs plus `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`)
- [x] Add tests in `versionRegistry.test.ts`: `isKnownVersion('0.18.0')` returns true, capabilities include the new built-ins, version resolution for `>= 0.18.0` resolves exactly, `>= 0.15.0` falls back to `0.18.0`

## Group 2: Built-in Documentation

- [x] Add documentation entries in `builtinDocs.ts` for: `left`, `right`, `burnAddress`, `Either`, `ZswapCoinPublicKey`, `ContractAddress`, `Maybe`
- [x] Update `builtinDocs.test.ts` to verify the new entries exist and the total count is correct (was 34, now 41)

## Group 3: Integration Tests

- [x] Add integration test in `integration.test.ts`: file with `pragma language_version 0.18.0;` parses, builds symbol table with new built-ins available (e.g. `Either`, `left` in scope), and completions include the new types/functions
- [x] Add integration test: file with `pragma language_version >= 0.15.0;` resolves to `0.18.0` (now the next highest), verify version-resolved diagnostic

## Group 4: Maintenance Note

- [x] Add a note to CLAUDE.md in the Domain Context section about periodically checking https://github.com/OpenZeppelin/compact-contracts for pragma version updates and keeping the version registry current
