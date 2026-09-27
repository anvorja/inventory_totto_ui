import { ShieldIcon, UserRoundIcon } from "lucide-react"
import { useState } from "react"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useStore } from "@/hooks/useStore"
import type { User, UserInput, UserRole } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/** "María José Pérez Gómez" → "maria.perez" */
function suggestUsername(fullName: string) {
  const words = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ""
  const surname = words.length >= 3 ? words[2] : words[1]
  return [words[0], surname].filter(Boolean).join(".")
}

const ROLES: {
  value: UserRole
  label: string
  hint: string
  icon: typeof ShieldIcon
}[] = [
  {
    value: "asesor",
    label: "Asesor",
    hint: "Cuenta productos y consulta diferencias.",
    icon: UserRoundIcon,
  },
  {
    value: "administrador",
    label: "Administrador",
    hint: "Además sube Excel, gestiona conteos, exporta y administra usuarios.",
    icon: ShieldIcon,
  },
]

export function UserFormSheet({
  open,
  onOpenChange,
  user,
  pending,
  error,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si viene, el formulario edita (el usuario no se puede cambiar). */
  user?: User | null
  pending: boolean
  error?: string | null
  onSubmit: (input: UserInput) => void
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      description={
        user
          ? `@${user.username}`
          : "Le daremos una contraseña temporal para su primer ingreso."
      }
    >
      {/* key: reinicia el formulario al abrir otro usuario */}
      {open && (
        <UserForm
          key={user?.id ?? "new"}
          user={user}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
        />
      )}
    </ResponsiveSheet>
  )
}

function UserForm({
  user,
  pending,
  error,
  onSubmit,
}: {
  user?: User | null
  pending: boolean
  error?: string | null
  onSubmit: (input: UserInput) => void
}) {
  const { user: me } = useAuth()
  const { stores, store: currentStore } = useStore()
  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [username, setUsername] = useState(user?.username ?? "")
  const [usernameTouched, setUsernameTouched] = useState(!!user)
  const [role, setRole] = useState<UserRole>(user?.role ?? "asesor")
  // Por defecto los asesores quedan en la tienda activa.
  const [storeId, setStoreId] = useState<number | null>(
    user
      ? (user.store?.id ?? null)
      : (me?.store?.id ?? currentStore?.id ?? null)
  )
  const storeLocked = !!me?.store // un admin de tienda solo crea usuarios de su tienda

  const valid =
    fullName.trim().length >= 2 && /^[a-z0-9._-]{3,40}$/.test(username)

  return (
    <form
      className="flex flex-col gap-5 pb-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid)
          onSubmit({ fullName: fullName.trim(), username, role, storeId })
      }}
    >
      <Field>
        <FieldLabel htmlFor="user-name">Nombre completo</FieldLabel>
        <Input
          id="user-name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            if (!usernameTouched) setUsername(suggestUsername(e.target.value))
          }}
          autoComplete="off"
          className="h-11 text-base"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="user-username">Usuario</FieldLabel>
        <Input
          id="user-username"
          value={username}
          disabled={!!user}
          onChange={(e) => {
            setUsernameTouched(true)
            setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))
          }}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-11 font-mono text-base"
        />
        <FieldDescription>
          Minúsculas, números, punto o guion. Con esto ingresará.
        </FieldDescription>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Rol</legend>
        {ROLES.map((r) => {
          const Icon = r.icon
          const active = role === r.value
          return (
            <label
              key={r.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
                active ? "border-primary bg-primary/10" : "hover:bg-muted"
              )}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={active}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <Icon
                className={cn(
                  "mt-0.5 size-5",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              />
              <span>
                <span className="block font-medium">{r.label}</span>
                <span className="block text-sm text-muted-foreground">
                  {r.hint}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>

      <Field>
        <FieldLabel htmlFor="user-store">Tienda</FieldLabel>
        <select
          id="user-store"
          value={storeId ?? ""}
          disabled={storeLocked}
          onChange={(e) =>
            setStoreId(e.target.value ? Number(e.target.value) : null)
          }
          className="h-11 rounded-2xl border border-input bg-transparent px-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 dark:bg-input/30"
        >
          {!storeLocked && <option value="">Todas las tiendas</option>}
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} · {s.name}
            </option>
          ))}
        </select>
        <FieldDescription>
          Solo verá y contará en la tienda asignada.
        </FieldDescription>
      </Field>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="xl" disabled={!valid || pending}>
        {pending && <Spinner />}
        {user ? "Guardar cambios" : "Crear usuario"}
      </Button>
    </form>
  )
}
