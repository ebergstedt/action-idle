import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
    host: true, // Listen on all interfaces (needed for Docker)
    watch: {
      usePolling: true, // Needed for Docker/WSL file watching
      interval: 100,
    },
  },
});
