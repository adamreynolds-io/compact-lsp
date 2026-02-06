## Context

The LSP's version-aware infrastructure was built in the `pragma-version-aware-parsing` change. It includes a version registry (`versionRegistry.ts`), version resolution with `>=` fallback, version-gated root scope, and built-in documentation. Currently only 0.14.0 is registered. Adding 0.18.0 is a data-only extension — no architectural changes needed.

## Goals / Non-Goals

**Goals:**
- Register 0.18.0 in the version registry with correct built-in types, functions, and ADT types
- Add documentation for new built-ins so hover/completion/signature help work
- Validate against real-world usage (OpenZeppelin compact-contracts)
- Add a maintenance note about periodically checking for version updates

**Non-Goals:**
- Parser changes (0.18.0 syntax is a superset parsed the same way)
- New provider features (existing version-gating handles everything)
- Supporting intermediate versions between 0.14.0 and 0.18.0

## Decisions

### Decision 1: 0.18.0 built-ins derived from OpenZeppelin compact-contracts

The 0.18.0 built-in list is derived from analyzing all `.compact` files in https://github.com/OpenZeppelin/compact-contracts (which all use `pragma language_version >= 0.18.0`).

New additions over 0.14.0:
- **Functions:** `left` (Either constructor), `right` (Either constructor), `burnAddress` (returns zero address)
- **ADT types:** `Either` (sum type), `ZswapCoinPublicKey` (public key type), `ContractAddress` (contract address type), `Maybe` (optional type)
- **Types and other functions:** All 0.14.0 built-ins carry forward unchanged

### Decision 2: Superset approach for version entries

0.18.0 includes all 0.14.0 built-ins plus additions. Each registry entry is self-contained (full list, not a diff), consistent with the existing 0.14.0 entry pattern.

### Decision 3: Maintenance note in CLAUDE.md

Add a note in the Domain Context section of CLAUDE.md linking to the OpenZeppelin repo and reminding to check if the pragma version has been updated. This ensures future development sessions are aware of the need to keep the registry current.

## Risks / Trade-offs

- **Incomplete built-in list:** The 0.18.0 list is derived from usage in OpenZeppelin contracts, not from official compiler documentation. Some built-ins may be missing if they're not used in that codebase. Acceptable risk — we can add more as discovered.
- **Version gap:** No entries for 0.15.0–0.17.0. Files using those exact versions will get `unsupported-version` warnings. Files using `>=` will fall back to the next highest (0.18.0). This is the intended design.
