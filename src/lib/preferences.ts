/**
 * Preferencias del dispositivo (tema y nombre de quien cuenta). Es lo único que se guarda
 * localmente: todos los datos de inventario viven en el backend.
 */
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writePreference(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Modo privado o almacenamiento bloqueado: la preferencia vive solo en memoria.
  }
}
