import { defineConfig } from 'vite';

export default defineConfig({
  // index.html at the project root is the entry point.
  root: '.',

  // Relative asset URLs in the build output, so dist/ works whether it is
  // deployed at a domain root or in a subfolder.
  base: './',

  server: {
    port: 5173,
    open: true,
    // Keep the large source PDFs in _source/ out of the dev server.
    fs: {
      deny: ['**/_source/**'],
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
