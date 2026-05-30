import { defineConfig } from 'vite';

// Overrides only for the dev server.
// Angular's application builder merges this file with its internal Vite config.
export default defineConfig({
  server: {
    headers: {
      // Allow Google Identity Services (One Tap / FedCM) to communicate back
      // to the parent page via postMessage. 'same-origin' breaks it.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
});
