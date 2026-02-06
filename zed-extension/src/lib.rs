use zed_extension_api as zed;

struct CompactExtension;

impl zed::Extension for CompactExtension {
    fn new() -> Self {
        CompactExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command, String> {
        let path = worktree.which("compact-lsp").ok_or_else(|| {
            "compact-lsp not found on PATH. Install it with: npm install -g compact-lsp-server"
                .to_string()
        })?;

        Ok(zed::Command {
            command: path,
            args: vec!["--stdio".to_string()],
            env: vec![],
        })
    }
}

zed::register_extension!(CompactExtension);
