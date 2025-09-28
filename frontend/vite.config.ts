import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: { global: true },
      include: ['buffer', 'process', 'path'],
      exclude: ['child_process', 'fs', 'readline', 'vm', 'stream']
    }),
  ],
  define: {
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js built-ins when imported by 0g-serving-broker
        if (id === 'child_process' || id === 'fs/promises' || id === 'readline' || id === 'vm' || id === 'stream') {
          return true;
        }
        return false;
      }
    }
  },
  server: {
    fs: {
      // Restrict file access to prevent server.fs.deny bypass vulnerabilities
      deny: [
        '.env',
        '.env.*',
        '*.pem',
        '*.key',
        '*.cert',
        'package.json',
        'package-lock.json',
        'node_modules',
        '.git',
      ],
    },
  },
});