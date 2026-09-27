import { LogOutIcon } from "lucide-react"
import type { ReactNode } from "react"

import { AuthLayout } from "@/components/auth/AuthLayout"
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"
import { BrandMark } from "@/components/layout/BrandMark"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { LoginPage } from "@/pages/LoginPage"

/**
 * Decide qué ve la persona según su sesión. Mantiene la URL intacta, así un enlace a
 * un conteo sigue funcionando después de ingresar.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
        <BrandMark />
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (user.mustChangePassword) {
    return (
      <AuthLayout
        title={`Hola, ${user.fullName.split(" ")[0]}`}
        description="Por seguridad, cambia la contraseña temporal que te entregaron."
      >
        <ChangePasswordForm currentLabel="Contraseña temporal" />
        <Button variant="ghost" size="lg" className="mt-4" onClick={logout}>
          <LogOutIcon /> Salir
        </Button>
      </AuthLayout>
    )
  }

  return <>{children}</>
}
