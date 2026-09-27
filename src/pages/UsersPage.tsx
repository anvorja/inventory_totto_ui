import {
  EllipsisVerticalIcon,
  KeyRoundIcon,
  PencilIcon,
  ShieldOffIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/PageHeader"
import { QueryError } from "@/components/common/QueryError"
import { TemporaryPasswordSheet } from "@/components/users/TemporaryPasswordSheet"
import { UserFormSheet } from "@/components/users/UserFormSheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import {
  useCreateUser,
  useResetPassword,
  useUpdateUser,
  useUsers,
} from "@/hooks/useUsers"
import type { User, UserWithPassword } from "@/lib/api/types"
import { formatRelative, initials } from "@/lib/format"
import { ROLE_LABEL } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export function UsersPage() {
  const { can, user: me } = useAuth()
  const { data: users = [], isLoading, error, refetch } = useUsers()
  const create = useCreateUser()
  const update = useUpdateUser()
  const reset = useResetPassword()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [temporary, setTemporary] = useState<UserWithPassword | null>(null)
  const [confirm, setConfirm] = useState<{
    kind: "reset" | "toggle"
    user: User
  } | null>(null)

  if (!can("users.manage")) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldOffIcon />
          </EmptyMedia>
          <EmptyTitle>Solo para administradores</EmptyTitle>
          <EmptyDescription>
            No tienes permiso para gestionar usuarios.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  if (error) return <QueryError error={error} onRetry={refetch} />

  const openCreate = () => {
    setEditing(null)
    create.reset()
    update.reset()
    setFormOpen(true)
  }

  const groups: { title: string; items: User[] }[] = [
    {
      title: "Administradores",
      items: users.filter((u) => u.isActive && u.role === "administrador"),
    },
    {
      title: "Asesores",
      items: users.filter((u) => u.isActive && u.role === "asesor"),
    },
    { title: "Desactivados", items: users.filter((u) => !u.isActive) },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Usuarios"
        description="Quién puede ingresar y qué puede hacer."
        actions={
          <Button size="xl" onClick={openCreate}>
            <UserPlusIcon /> Nuevo usuario
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : (
        <div className="flex flex-col gap-6">
          {groups
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <section key={group.title}>
                <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
                  {group.title} · {group.items.length}
                </h2>
                <ul className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/5 dark:ring-foreground/10">
                  {group.items.map((u) => (
                    <li
                      key={u.id}
                      className={cn(
                        "flex items-center gap-3 border-b px-4 py-3 last:border-b-0",
                        !u.isActive && "opacity-60"
                      )}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {initials(u.fullName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate font-medium">
                            {u.fullName}
                          </span>
                          {u.id === me?.id && (
                            <Badge variant="outline">Tú</Badge>
                          )}
                          {u.mustChangePassword && u.isActive && (
                            <Badge
                              variant="secondary"
                              className="bg-warning/15 text-warning"
                            >
                              Contraseña temporal
                            </Badge>
                          )}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          @{u.username} ·{" "}
                          {u.store ? u.store.code : "Todas las tiendas"} ·{" "}
                          {u.lastLoginAt
                            ? `Ingresó ${formatRelative(u.lastLoginAt)}`
                            : "Nunca ha ingresado"}
                        </div>
                      </div>
                      <Badge
                        variant={
                          u.role === "administrador" ? "default" : "secondary"
                        }
                        className="hidden sm:inline-flex"
                      >
                        {ROLE_LABEL[u.role]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={`Opciones de ${u.fullName}`}
                          >
                            <EllipsisVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-56">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditing(u)
                              update.reset()
                              setFormOpen(true)
                            }}
                          >
                            <PencilIcon /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!u.isActive}
                            onSelect={() =>
                              setConfirm({ kind: "reset", user: u })
                            }
                          >
                            <KeyRoundIcon /> Restablecer contraseña
                          </DropdownMenuItem>
                          {u.id !== me?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant={u.isActive ? "destructive" : "default"}
                                onSelect={() =>
                                  setConfirm({ kind: "toggle", user: u })
                                }
                              >
                                {u.isActive ? <UserXIcon /> : <UserCheckIcon />}
                                {u.isActive ? "Desactivar" : "Reactivar"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      <UserFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        pending={create.isPending || update.isPending}
        error={(editing ? update.error : create.error)?.message}
        onSubmit={(input) => {
          if (editing) {
            update.mutate(
              {
                id: editing.id,
                fullName: input.fullName,
                role: input.role,
                storeId: input.storeId,
              },
              {
                onSuccess: () => {
                  setFormOpen(false)
                  toast.success("Usuario actualizado")
                },
              }
            )
          } else {
            create.mutate(input, {
              onSuccess: (data) => {
                setFormOpen(false)
                setTemporary(data)
              },
            })
          }
        }}
      />

      <TemporaryPasswordSheet
        data={temporary}
        onClose={() => setTemporary(null)}
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "reset"
                ? `¿Restablecer la contraseña de ${confirm.user.fullName}?`
                : confirm?.user.isActive
                  ? `¿Desactivar a ${confirm?.user.fullName}?`
                  : `¿Reactivar a ${confirm?.user.fullName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "reset"
                ? "Se generará una contraseña temporal y se cerrarán sus sesiones abiertas."
                : confirm?.user.isActive
                  ? "No podrá ingresar y se cerrarán sus sesiones. Sus lecturas se conservan."
                  : "Podrá volver a ingresar con su contraseña actual."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirm?.kind === "toggle" && confirm.user.isActive
                  ? "destructive"
                  : "default"
              }
              onClick={() => {
                if (!confirm) return
                const onError = (e: Error) => toast.error(e.message)
                if (confirm.kind === "reset") {
                  reset.mutate(confirm.user.id, {
                    onSuccess: setTemporary,
                    onError,
                  })
                } else {
                  update.mutate(
                    { id: confirm.user.id, isActive: !confirm.user.isActive },
                    {
                      onSuccess: (u) =>
                        toast.success(
                          u.isActive
                            ? "Usuario reactivado"
                            : "Usuario desactivado"
                        ),
                      onError,
                    }
                  )
                }
              }}
            >
              {confirm?.kind === "reset"
                ? "Restablecer"
                : confirm?.user.isActive
                  ? "Desactivar"
                  : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
