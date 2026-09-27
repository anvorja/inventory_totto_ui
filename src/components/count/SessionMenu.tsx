import { useNavigate } from "@tanstack/react-router"
import {
  EllipsisVerticalIcon,
  LockIcon,
  LockOpenIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useDeleteSession, useUpdateSession } from "@/hooks/useSessions"
import type { CountSession } from "@/lib/api/types"
import { formatNumber } from "@/lib/format"

export function SessionMenu({ session }: { session: CountSession }) {
  const update = useUpdateSession()
  const remove = useDeleteSession()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState<"close" | "delete" | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(session.name)
  const isOpen = session.status === "open"

  const setStatus = (status: CountSession["status"]) =>
    update.mutate(
      { id: session.id, status },
      {
        onSuccess: () => {
          toast.success(
            status === "closed" ? "Conteo cerrado" : "Conteo reabierto"
          )
          if (status === "closed")
            navigate({
              to: "/conteos/$sessionId/diferencias",
              params: { sessionId: String(session.id) },
            })
        },
        onError: (e) => toast.error(e.message),
      }
    )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Opciones del conteo"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem onSelect={() => setRenaming(true)}>
            <PencilIcon /> Renombrar
          </DropdownMenuItem>
          {isOpen ? (
            <DropdownMenuItem onSelect={() => setConfirm("close")}>
              <LockIcon /> Cerrar conteo
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setStatus("open")}>
              <LockOpenIcon /> Reabrir conteo
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirm("delete")}
          >
            <Trash2Icon /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "close"
                ? "¿Cerrar este conteo?"
                : "¿Eliminar este conteo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "close"
                ? "Nadie podrá seguir sumando lecturas. Podrás revisar las diferencias, exportarlas y reabrirlo si hace falta."
                : `Se borrarán ${formatNumber(session.entries)} lecturas (${formatNumber(session.countedUnits)} unidades). Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm === "delete" ? "destructive" : "default"}
              onClick={() => {
                if (confirm === "close") setStatus("closed")
                else
                  remove.mutate(session.id, {
                    onSuccess: () => {
                      toast.success("Conteo eliminado")
                      navigate({ to: "/" })
                    },
                    onError: (e) => toast.error(e.message),
                  })
              }}
            >
              {confirm === "close" ? "Cerrar conteo" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveSheet
        open={renaming}
        onOpenChange={setRenaming}
        title="Renombrar conteo"
        footer={
          <Button
            size="xl"
            disabled={!name.trim()}
            onClick={() =>
              update.mutate(
                { id: session.id, name: name.trim() },
                { onSuccess: () => setRenaming(false) }
              )
            }
          >
            Guardar
          </Button>
        }
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2 h-11 text-base"
          maxLength={120}
        />
      </ResponsiveSheet>
    </>
  )
}
