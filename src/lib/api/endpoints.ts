import { apiBlob, apiJson } from "./client"
import type {
  Comparison,
  CountEntry,
  CountSession,
  ImportKind,
  ImportResult,
  Product,
  ProductInput,
  ScanInput,
  ScanResult,
  Snapshot,
  StoreOverview,
  UndoResult,
  User,
  UserInput,
  UserWithPassword,
} from "./types"

const qs = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "")
      search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiJson<User>("/auth/login", {
        method: "POST",
        body: { username, password },
      }),
    logout: () => apiJson<void>("/auth/logout", { method: "POST" }),
    me: () => apiJson<User>("/auth/me"),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiJson<User>("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      }),
  },
  users: {
    list: () => apiJson<User[]>("/users"),
    create: (input: UserInput) =>
      apiJson<UserWithPassword>("/users", { method: "POST", body: input }),
    update: (
      id: number,
      input: Partial<Omit<UserInput, "username">> & { isActive?: boolean }
    ) => apiJson<User>(`/users/${id}`, { method: "PATCH", body: input }),
    resetPassword: (id: number) =>
      apiJson<UserWithPassword>(`/users/${id}/reset-password`, {
        method: "POST",
      }),
  },
  stores: {
    list: () => apiJson<StoreOverview[]>("/stores"),
    snapshots: (storeId: number) =>
      apiJson<Snapshot[]>(`/stores/${storeId}/snapshots`),
    sessions: (storeId: number) =>
      apiJson<CountSession[]>(`/stores/${storeId}/sessions`),
  },
  imports: {
    upload: (
      file: File,
      options: { kind?: ImportKind; effectiveAt?: string } = {}
    ) => {
      const form = new FormData()
      form.append("file", file)
      if (options.kind) form.append("kind", options.kind)
      if (options.effectiveAt) form.append("effective_at", options.effectiveAt)
      return apiJson<ImportResult>("/imports", { method: "POST", body: form })
    },
  },
  snapshots: {
    remove: (id: number) =>
      apiJson<void>(`/snapshots/${id}`, { method: "DELETE" }),
  },
  products: {
    search: (q: string) =>
      apiJson<Product[]>(`/products${qs({ q, limit: 20 })}`),
    register: (input: ProductInput) =>
      apiJson<Product>("/products", { method: "POST", body: input }),
  },
  sessions: {
    get: (id: number) => apiJson<CountSession>(`/sessions/${id}`),
    create: (input: {
      storeId: number
      name: string
      baselineSnapshotId?: number | null
    }) => apiJson<CountSession>("/sessions", { method: "POST", body: input }),
    update: (
      id: number,
      input: Partial<
        Pick<CountSession, "name" | "status" | "baselineSnapshotId">
      >
    ) =>
      apiJson<CountSession>(`/sessions/${id}`, {
        method: "PATCH",
        body: input,
      }),
    remove: (id: number) =>
      apiJson<void>(`/sessions/${id}`, { method: "DELETE" }),
    scan: (id: number, input: ScanInput) =>
      apiJson<ScanResult>(`/sessions/${id}/scans`, {
        method: "POST",
        body: input,
      }),
    recent: (id: number, limit = 30) =>
      apiJson<CountEntry[]>(`/sessions/${id}/scans${qs({ limit })}`),
    undo: (id: number, entryId: number) =>
      apiJson<UndoResult>(`/sessions/${id}/scans/${entryId}`, {
        method: "DELETE",
      }),
    comparison: (id: number, snapshotId?: number | null) =>
      apiJson<Comparison>(
        `/sessions/${id}/comparison${qs({ snapshot_id: snapshotId })}`
      ),
    exportXlsx: (id: number, snapshotId?: number | null) =>
      apiBlob(`/sessions/${id}/export${qs({ snapshot_id: snapshotId })}`),
  },
}
