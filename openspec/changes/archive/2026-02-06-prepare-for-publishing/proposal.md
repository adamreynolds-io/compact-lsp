## Why

The project has a standalone server, editor integrations, and an Apache 2.0 license, but all three packages have `"private": true` and lack the metadata required for publishing. Users can't actually install anything via `npm install -g` or the VS Code / Zed marketplaces yet.

## What Changes

- Remove `"private": true` from `server/package.json` and add npm publishing metadata (description, license, repository, files, keywords)
- Remove `"private": true` from `extension/package.json` and add VS Code Marketplace metadata (publisher, repository, license, icon, bundled server)
- Update VS Code extension to bundle the server so it's self-contained (no separate npm install needed for VS Code users)
- Prepare Zed extension for marketplace submission (ensure extension.toml has all required fields)
- Add a `prepublishOnly` script to validate builds before publish

## Capabilities

### New Capabilities
- `npm-publishing`: npm package metadata and publishing readiness for `compact-lsp-server`
- `vscode-publishing`: VS Code Marketplace metadata, server bundling, and packaging readiness
- `zed-publishing`: Zed extension marketplace submission readiness

### Modified Capabilities

None — no behavioral changes, only packaging and metadata.

## Impact

- **server/package.json**: Remove `private`, add metadata fields, add `files` whitelist, add `prepublishOnly` script
- **extension/package.json**: Remove `private`, add `publisher`, `repository`, `license`, `icon`; bundle server in extension
- **zed-extension/extension.toml**: Verify all marketplace-required fields present
- **Build pipeline**: Extension build needs to copy server output into extension bundle
- **No runtime behavior changes**: All LSP features remain identical
