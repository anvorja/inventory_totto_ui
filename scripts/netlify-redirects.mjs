// Escribe dist/_redirects para Netlify después del build:
// - /api/* se envía por proxy al API (API_ORIGIN): el navegador ve el API en el mismo dominio
//   que la app, así la cookie httpOnly de sesión (SameSite=Lax) funciona. netlify.app y
//   onrender.com son sitios distintos: sin el proxy la cookie sería de terceros y los
//   navegadores (Safari/iOS en particular) la bloquean.
// - /assets/* inexistente responde 404 real (no index.html): tras un deploy, una pestaña
//   vieja que pide un archivo renombrado recibe un error claro y la app se recarga sola.
// - Cualquier otra ruta cae en index.html (aplicación de una sola página).
import { writeFileSync } from "node:fs"

// Respuesta de los assets que no existen (los que sí existen se sirven antes que la regla).
writeFileSync("dist/asset-not-found.txt", "Not found\n")

const origin = process.env.API_ORIGIN?.replace(/\/+$/, "")
if (!origin || !/^https:\/\/[^/]+$/.test(origin)) {
  console.error(
    "Define API_ORIGIN con el origen del API, p. ej. https://inventory-totto-api.onrender.com"
  )
  process.exit(1)
}

writeFileSync(
  "dist/_redirects",
  [
    `/api/*  ${origin}/api/:splat  200`,
    "/assets/*  /asset-not-found.txt  404",
    "/*  /index.html  200",
    "",
  ].join("\n")
)
console.log(`dist/_redirects: /api/* → ${origin}`)
