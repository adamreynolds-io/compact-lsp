## 1. Core Provider

- [x] 1.1 Create `server/src/foldingRanges.ts` with `getFoldingRanges(sourceFile: SourceFile): FoldingRange[]` function
- [x] 1.2 Implement folding for block declarations (module, circuit, struct, enum, contract, constructor) — skip single-line declarations
- [x] 1.3 Implement recursive descent into module declarations for nested folds
- [x] 1.4 Implement folding for statement blocks (for, if, block) inside circuit/constructor bodies
- [x] 1.5 Implement consecutive import group detection and folding with `FoldingRangeKind.Imports`

## 2. Server Integration

- [x] 2.1 Register `foldingRangeProvider: true` in server capabilities
- [x] 2.2 Add `onFoldingRanges` handler that retrieves cached parse result and calls `getFoldingRanges()`
- [x] 2.3 Return empty array for unknown documents

## 3. Tests

- [x] 3.1 Create `server/src/foldingRanges.test.ts` with tests for each block declaration type
- [x] 3.2 Add tests for nested declarations inside modules
- [x] 3.3 Add tests for statement-level folds (for, if)
- [x] 3.4 Add tests for import group folding (consecutive, single, non-contiguous)
- [x] 3.5 Add tests for edge cases (empty file, single-line declarations, parse errors)
