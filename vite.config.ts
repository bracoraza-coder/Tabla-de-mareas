import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Pure static site: no server, no API keys, no paid services.
// Live weather/wave data is fetched client-side, directly from the
// free, keyless Open-Meteo API (see src/utils/liveMarineFetcher.ts).
export default defineConfig(() => {
  return {
    root: __dirname,
    publicDir: 'public',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
