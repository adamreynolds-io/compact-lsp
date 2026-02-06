## ADDED Requirements

### Requirement: Server package is publishable to npm
The `server/package.json` SHALL NOT have `"private": true` and SHALL include all metadata required by npm for public publishing.

#### Scenario: Required npm metadata present
- **WHEN** `server/package.json` is inspected
- **THEN** it SHALL include `description`, `license` (set to `"Apache-2.0"`), `repository`, `keywords`, and `author` fields
- **AND** it SHALL NOT include `"private": true`

### Requirement: Files whitelist limits published content
The `server/package.json` SHALL include a `"files"` field that whitelists only the compiled output directory.

#### Scenario: Only compiled files are published
- **WHEN** `npm pack` is run in the server directory
- **THEN** the tarball SHALL contain only files from the `out/` directory and `package.json`
- **AND** it SHALL NOT contain TypeScript source, tests, or config files

### Requirement: Prepublish validation
The server package SHALL include a `prepublishOnly` script that builds and validates the package before publish.

#### Scenario: Build runs before publish
- **WHEN** `npm publish` is run in the server directory
- **THEN** the `prepublishOnly` script SHALL run `npm run build` to ensure compiled output is up to date
