import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `--mode shopify` produces the theme-asset build: relative base (the
// CSS finds its fonts as flat siblings on Shopify's CDN) and stable,
// unhashed file names so the Liquid page template never needs editing
// after a rebuild.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === 'shopify'
    ? {
        base: './',
        build: {
          outDir: 'dist-shopify',
          rollupOptions: {
            output: {
              entryFileNames: 'qa-index.js',
              chunkFileNames: 'qa-chunk-[name].js',
              assetFileNames: (info: { names?: string[] }) => {
                const n = info.names?.[0] ?? '';
                if (n.endsWith('.css')) return 'qa-index.css';
                return 'qa-[name][extname]';
              },
            },
          },
        },
      }
    : {}),
}))
