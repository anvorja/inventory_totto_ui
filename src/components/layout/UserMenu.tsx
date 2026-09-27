import { Link } from "@tanstack/react-router"
import { KeyRoundIcon, LogOutIcon, UsersIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { initials } from "@/lib/format"
import { ROLE_LABEL } from "@/lib/permissions"

export function UserMenu() {
  const { user, can, logout } = useAuth()
  const [changing, setChanging] = useState(false)
  if (!user) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full"
            aria-label={`Cuenta de ${user.fullName}`}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {initials(user.fullName)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuLabel className="flex flex-col gap-1 py-2">
            <span className="text-sm font-semibold text-foreground">
              {user.fullName}
            </span>
            <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              @{user.username}
              <Badge
                variant={
                  user.role === "administrador" ? "default" : "secondary"
                }
              >
                {ROLE_LABEL[user.role]}
              </Badge>
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {user.store
                ? `${user.store.code} · ${user.store.name}`
                : "Todas las tiendas"}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {can("users.manage") && (
            <DropdownMenuItem asChild>
              <Link to="/usuarios">
                <UsersIcon /> Usuarios
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setChanging(true)}>
            <KeyRoundIcon /> Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
            <LogOutIcon /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveSheet
        open={changing}
        onOpenChange={setChanging}
        title="Cambiar contraseña"
        description="Las demás sesiones abiertas con tu usuario se cerrarán."
      >
        <div className="pb-4">
          <ChangePasswordForm
            onDone={() => {
              setChanging(false)
              toast.success("Contraseña actualizada")
            }}
          />
        </div>
      </ResponsiveSheet>
    </>
  )
}
