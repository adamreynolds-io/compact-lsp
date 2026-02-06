## 1. npm Publishing (server)

- [x] 1.1 Remove `"private": true` from `server/package.json` and add metadata: `description`, `license` ("Apache-2.0"), `repository`, `keywords`, `author`
- [x] 1.2 Add `"files": ["out"]` to `server/package.json` to whitelist only compiled output
- [x] 1.3 Add `"prepublishOnly": "npm run build"` script to `server/package.json`
- [x] 1.4 Verify with `npm pack --dry-run` that only expected files are included

## 2. VS Code Marketplace (extension)

- [x] 2.1 Remove `"private": true` from `extension/package.json` and add metadata: `publisher` (placeholder), `repository`, `license` ("Apache-2.0")
- [x] 2.2 Update `extension/src/extension.ts` to resolve server path as `path.join('server', 'out', 'server.js')` instead of `path.join('..', 'server', 'out', 'server.js')`
- [x] 2.3 Add `"vscode:prepublish"` script to `extension/package.json` that builds the server, builds the extension, and copies `../server/out/` to `server/out/` within the extension directory
- [x] 2.4 Create `extension/.vscodeignore` excluding `src/`, `tsconfig.json`, `*.ts`, and other dev files
- [x] 2.5 Verify with `vsce package` (or `vsce ls`) that the `.vsix` contains the bundled server and is self-contained

## 3. Zed Marketplace (extension)

- [x] 3.1 Add `repository` field to `zed-extension/extension.toml`
- [x] 3.2 Verify all required marketplace fields are present in `extension.toml`
