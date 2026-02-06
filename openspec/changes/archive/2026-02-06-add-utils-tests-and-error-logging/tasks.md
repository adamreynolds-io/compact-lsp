## 1. Utils Tests

- [x] 1.1 Create server/src/utils.test.ts with test helpers
- [x] 1.2 Test findTokenAtPosition: cursor on token, between tokens, EOF skipped
- [x] 1.3 Test isPositionInRange: inside, before, after, on boundary
- [x] 1.4 Test findScopeForPosition: inside circuit → circuit scope, outside → file scope
- [x] 1.5 Test findChildScopeForDecl: named decl, constructor, no match

## 2. Error Logging

- [x] 2.1 Add logging to scanWorkspaceFolder catch block
- [x] 2.2 Add logging to scanDir file-read catch block
- [x] 2.3 Add logging to onDidChangeWatchedFiles catch block

## 3. Verify

- [x] 3.1 Run full test suite — all tests pass
