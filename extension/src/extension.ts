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
  const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

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
