import { CheckIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react"
import { useState } from "react"

import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

const MIN_LENGTH = 8

export function ChangePasswordForm({
  currentLabel = "Contraseña actual",
  onDone,
}: {
  currentLabel?: string
  onDone?: () => void
}) {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const longEnough = next.length >= MIN_LENGTH
  const matches = next.length > 0 && next === confirm
  const valid = current.length > 0 && longEnough && matches

  const submit = async () => {
    if (!valid) return
    setPending(true)
    setError(null)
    try {
      await changePassword(current, next)
      onDone?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Field>
        <FieldLabel htmlFor="current-password">{currentLabel}</FieldLabel>
        <PasswordInput
          id="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
        <PasswordInput
          id="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="confirm-password">
          Repite la nueva contraseña
        </FieldLabel>
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <ul className="flex flex-col gap-1 text-sm" aria-label="Requisitos">
        <Requirement ok={longEnough}>
          Al menos {MIN_LENGTH} caracteres
        </Requirement>
        <Requirement ok={matches}>Las dos contraseñas coinciden</Requirement>
      </ul>
      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" size="xl" disabled={!valid || pending}>
        {pending ? <Spinner /> : <KeyRoundIcon />}
        Guardar contraseña
      </Button>
    </form>
  )
}

function Requirement({
  ok,
  children,
}: {
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        ok ? "text-success" : "text-muted-foreground"
      )}
    >
      <CheckIcon className={cn("size-4", !ok && "opacity-30")} />
      {children}
    </li>
  )
}
