import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      'virtual:pwa-register/react': path.resolve(__dirname, 'src/tests/__mocks__/virtual-pwa.ts')
    }
  }
});
