import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContext, window, workspace } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext): void {
  // In packaged extension: server is bundled at extension/server/out/server.js
  // In development (F5): server is at ../server/out/server.js relative to extension/
  const bundledServer = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
  const devServer = context.asAbsolutePath(path.join('..', 'server', 'out', 'server.js'));
  const serverModule = fs.existsSync(bundledServer) ? bundledServer : devServer;

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: { module: serverModule, transport: TransportKind.stdio },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'compact' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.compact'),
    },
  };

  client = new LanguageClient(
    'compact-lsp',
    'Compact Language Server',
    serverOptions,
    clientOptions,
  );

  client.start().catch((error) => {
    window.showErrorMessage(`Compact Language Server failed to start: ${error.message}`);
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
