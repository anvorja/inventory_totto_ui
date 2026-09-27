import { LogInIcon, TriangleAlertIcon } from "lucide-react"
import { useState } from "react"

import { AuthLayout } from "@/components/auth/AuthLayout"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async () => {
    if (!username.trim() || !password) return
    setPending(true)
    setError(null)
    try {
      await login(username.trim(), password)
    } catch (e) {
      setError((e as Error).message)
      setPassword("")
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Conteo de inventario"
      description="Ingresa con tu usuario de tienda."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field>
          <FieldLabel htmlFor="username">Usuario</FieldLabel>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            autoFocus
            className="h-12 rounded-2xl text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
          />
        </Field>
        {error && (
          <div
            role="alert"
            className="flex gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
        <Button
          type="submit"
          size="xl"
          disabled={pending || !username.trim() || !password}
        >
          {pending ? <Spinner /> : <LogInIcon />}
          Ingresar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Olvidaste tu contraseña? Pídele al administrador de tu tienda que la
          restablezca.
        </p>
      </form>
    </AuthLayout>
  )
}
