import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // lista de ficheiros para o service worker guardar (funcionamento offline)
  build: { manifest: 'asset-manifest.json' },
  // identificador de cada versão publicada: obriga o service worker a guardar a nova versão completa
  define: { __VERSAO__: JSON.stringify(Date.now().toString(36)) },
})
