import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ECharts is split into its own lazily loaded chunk (~600 kB).
  build: { chunkSizeWarningLimit: 700 },
});
