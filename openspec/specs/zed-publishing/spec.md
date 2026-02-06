## ADDED Requirements

### Requirement: Zed extension has complete marketplace metadata
The `zed-extension/extension.toml` SHALL include all fields required for Zed marketplace submission.

#### Scenario: Required metadata present
- **WHEN** `zed-extension/extension.toml` is inspected
- **THEN** it SHALL include `id`, `name`, `version`, `description`, `authors`, and `schema_version` fields
- **AND** `[language_servers.compact-lsp]` SHALL be defined with `languages = ["Compact"]`

### Requirement: Repository field for marketplace linking
The `zed-extension/extension.toml` SHALL include a `repository` field pointing to the GitHub repository.

#### Scenario: Repository URL present
- **WHEN** `zed-extension/extension.toml` is inspected
- **THEN** it SHALL include `repository = "https://github.com/adamreynolds-io/compact-lsp"`
