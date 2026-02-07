## Why

The VS Code extension fails to start in development mode (F5) because the server module path resolution assumes a packaged layout. Additionally, the smoke test file created for manual testing contains syntax that doesn't match what the parser actually supports, making it useless for validation.

## What Changes

- Fix the extension's server module path resolution to work in both development (F5) and packaged (.vsix) modes
- Fix the smoke test file to use correct Compact syntax:
  - Replace `constructor(){}` inside contract body (not supported by contract parser) with top-level constructor
  - Replace `for i in 0..10 {}` with correct `for (const i of 0..10) {}` syntax
  - Replace `Utils::helper()` module access with correct `Utils.helper()` dot syntax
  - Replace non-existent built-in functions (`sum`, `length`, `zip`) with actual built-ins (`map`, `fold`, `pad`, `slice`)

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `vscode-extension`: Extension activation must resolve the server module path correctly in both dev mode (extensionDevelopmentPath) and packaged mode (bundled server)

## Impact

- `extension/src/extension.ts` — server module path resolution logic
- `smoke-test.compact` — corrected syntax for all 18 test sections
- No API changes, no dependency changes
