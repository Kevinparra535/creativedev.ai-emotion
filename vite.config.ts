import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ tsDecorators: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      find: './runtimeConfig',
      replacement: './runtimeConfig.browser'
    }
  },
  server: {
    host: true
  }
});
