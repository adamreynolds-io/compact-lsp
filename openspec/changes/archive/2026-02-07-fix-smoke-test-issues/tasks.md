## 1. Extension Server Path Fix

- [x] 1.1 Update `extension/src/extension.ts` to resolve server module with bundled-first, dev-fallback strategy using `fs.existsSync()`
- [x] 1.2 Rebuild extension (`npm run build -w extension`) and verify F5 launch starts the server successfully

## 2. Smoke Test Syntax Fixes

- [x] 2.1 Replace `constructor(owner: Field) {}` inside contract body with top-level `constructor` declaration
- [x] 2.2 Replace `for i in 0..10 {}` with correct `for (const i of 0..10) {}` syntax
- [x] 2.3 Replace `Utils::helper()` with correct `Utils.helper()` dot access syntax
- [x] 2.4 Replace non-existent built-in functions (`sum`, `length`, `zip`) with actual built-ins (`map`, `fold`, `pad`, `slice`)

## 3. Verification

- [x] 3.1 Run the parser against `smoke-test.compact` and verify 0 parse errors, 1 intentional undefined-reference error, and expected lint warnings
- [x] 3.2 Run the full test suite (`npm test`) to ensure no regressions
