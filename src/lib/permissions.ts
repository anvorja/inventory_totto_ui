import type { User } from "@/lib/api/types"

/**
 * Qué puede hacer cada rol. El backend valida lo mismo; aquí solo se usa para
 * mostrar u ocultar acciones y no ofrecer botones que terminarían en error.
 */
export type Permission =
  | "imports.upload" // subir Excel de existencias / maestro de códigos
  | "snapshots.delete"
  | "sessions.manage" // crear, renombrar, cerrar, reabrir, eliminar conteos
  | "sessions.baseline" // elegir contra qué existencias comparar
  | "sessions.export"
  | "entries.undoAny" // deshacer lecturas de otras personas
  | "users.manage"

const ADMIN_ONLY: ReadonlySet<Permission> = new Set([
  "imports.upload",
  "snapshots.delete",
  "sessions.manage",
  "sessions.baseline",
  "sessions.export",
  "entries.undoAny",
  "users.manage",
])

export function can(user: User | null, permission: Permission) {
  if (!user) return false
  return user.role === "administrador" || !ADMIN_ONLY.has(permission)
}

export const ROLE_LABEL: Record<User["role"], string> = {
  asesor: "Asesor",
  administrador: "Administrador",
}
