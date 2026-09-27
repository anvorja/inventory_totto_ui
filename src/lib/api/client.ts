const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "")

/** Error de la API con el `code` estable que devuelve el backend (p. ej. product_not_found). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly data: Record<string, unknown>

  constructor(status: number, message: string, data: Record<string, unknown>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = typeof data.code === "string" ? data.code : undefined
    this.data = data
  }
}

type AuthEvent = "unauthorized" | "password_change_required"
const authListeners = new Set<(event: AuthEvent) => void>()

/** Permite al AuthProvider enterarse de sesiones vencidas sin acoplar el cliente a React. */
export function onAuthEvent(listener: (event: AuthEvent) => void) {
  authListeners.add(listener)
  return () => {
    authListeners.delete(listener)
  }
}

function messageFrom(data: Record<string, unknown>, fallback: string) {
  const detail = data.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  return fallback
}

async function request(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      // La sesión viaja en una cookie httpOnly (no accesible desde JavaScript).
      credentials: "include",
      headers: { "X-Requested-With": "fetch", ...init.headers },
    })
  } catch {
    throw new ApiError(
      0,
      "Sin conexión con el servidor. Revisa tu internet.",
      {}
    )
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const error = new ApiError(
      response.status,
      messageFrom(data, `Error ${response.status}`),
      data
    )
    // El login fallido también es 401, pero no significa "sesión vencida".
    if (response.status === 401 && !path.startsWith("/auth/login")) {
      authListeners.forEach((l) => l("unauthorized"))
    }
    if (error.code === "password_change_required") {
      authListeners.forEach((l) => l("password_change_required"))
    }
    throw error
  }
  return response
}

export async function apiJson<T>(
  path: string,
  { body, ...init }: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const isForm = body instanceof FormData
  const response = await request(path, {
    ...init,
    headers:
      isForm || body === undefined
        ? init.headers
        : { "Content-Type": "application/json", ...init.headers },
    body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function apiBlob(
  path: string
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await request(path)
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const filename = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? null
  return { blob: await response.blob(), filename }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return (
    error instanceof ApiError && (code === undefined || error.code === code)
  )
}
