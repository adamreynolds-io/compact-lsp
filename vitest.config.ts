import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'server/src/**/*.test.ts',
      'extension/src/**/*.test.ts',
      'mcp-server/src/**/*.test.ts',
    ],
  },
});
