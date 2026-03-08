import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: './src/client.ts',
          output: {
            entryFileNames: 'static/client.js',
          },
        },
      },
    }
  }
  return {
    plugins: [pages()],
    build: {
      outDir: 'dist',
    },
    preview: {
      allowedHosts: ["webapp-topup-game-production.up.railway.app"]
  }
}
