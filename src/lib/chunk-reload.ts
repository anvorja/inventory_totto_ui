import { lazy, type ComponentType } from "react"

/**
 * Tras cada deploy los archivos de la app cambian de nombre (hash). Una pestaña abierta
 * desde antes pide los nombres viejos, que ya no existen, y la carga falla.
 * La solución es recargar una vez para obtener la versión nueva. La marca en
 * sessionStorage evita un bucle de recargas si el fallo es de otra causa (p. ej. sin red).
 */
const KEY = "conteo-totto:chunk-reload-at"
const WINDOW_MS = 10_000

export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  return /dynamically imported module|Importing a module script failed|module script|Loading chunk|preload/i.test(
    message
  )
}

/** Recarga la página una sola vez por ventana de tiempo. Devuelve si recargó. */
export function reloadOnceForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // Sin sessionStorage: se recarga igual (el navegador no entra en bucle sin él marcado).
  }
  window.location.reload()
  return true
}

/** Como React.lazy, pero si el archivo ya no existe (deploy nuevo) recarga la página. */
// Misma firma que React.lazy, para que cada página conserve el tipo de sus props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy<T>(async () => {
    try {
      return await factory()
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForNewVersion()) {
        return new Promise<never>(() => {}) // la página se está recargando
      }
      throw error
    }
  })
}

/** Vite avisa con este evento cuando falla la precarga de un archivo. */
export function installPreloadErrorHandler() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnceForNewVersion()) event.preventDefault()
  })
}
