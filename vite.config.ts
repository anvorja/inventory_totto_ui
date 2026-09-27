import { createRequire } from "node:module"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// El .wasm del lector de códigos se resuelve desde barcode-detector (dependencia transitiva)
// y se sirve desde la propia app en lugar de un CDN.
const require = createRequire(import.meta.url)
const zxingWasm = createRequire(require.resolve("barcode-detector")).resolve(
  "zxing-wasm/reader/zxing_reader.wasm"
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // Regex para conservar el sufijo "?url" de la importación.
      { find: /^virtual-zxing-reader\.wasm/, replacement: zxingWasm },
    ],
  },
  server: {
    host: true, // accesible desde el celular en la misma red
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ["barcode-detector"],
  },
})
