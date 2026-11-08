import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import seo from './scripts/seo/vitePluginSeo.js'
import netlifyRedirects from './scripts/netlify/vitePluginRedirects.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The '' prefix also loads API_ORIGIN, which has no VITE_ prefix so it never
  // reaches the browser bundle. Real environment variables (Netlify's) win
  // over the .env files.
  const env = loadEnv(mode, import.meta.dirname, '')

  return {
    plugins: [react(), tailwindcss(), seo(), netlifyRedirects(env.API_ORIGIN)],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    server: {
      // Mirrors the Netlify proxy, so the client calls a relative /api in every
      // environment and the refresh cookie stays first-party. Local API by
      // default; put API_ORIGIN in .env.local to develop against the live one.
      proxy: {
        '/api': { target: env.API_ORIGIN || 'http://127.0.0.1:5002', changeOrigin: true },
      },
    },
  }
})
