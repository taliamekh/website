import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `VITE_BASE` is set to "/expenses/" when this app is built as a sub-route of
// mekh.ca. Local dev/preview leave it unset and serve from "/".
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
