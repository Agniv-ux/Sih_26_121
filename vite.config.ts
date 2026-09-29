import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ECharts lives in its own lazily loaded chunk (~1 MB before gzip).
  build: { chunkSizeWarningLimit: 1200 },
});
