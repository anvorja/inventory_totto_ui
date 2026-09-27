import { CheckIcon, CopyIcon, ShieldCheckIcon } from "lucide-react"
import { useState } from "react"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Button } from "@/components/ui/button"
import type { UserWithPassword } from "@/lib/api/types"

/** Muestra una única vez la contraseña temporal para entregarla a la persona. */
export function TemporaryPasswordSheet({
  data,
  onClose,
}: {
  data: UserWithPassword | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin portapapeles (http): la contraseña sigue visible para dictarla.
    }
  }

  return (
    <ResponsiveSheet
      open={!!data}
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      title="Contraseña temporal"
      description={
        data && (
          <>
            Entrégasela a{" "}
            <span className="font-semibold text-foreground">
              {data.user.fullName}
            </span>{" "}
            (usuario <span className="font-mono">{data.user.username}</span>).
          </>
        )
      }
      footer={
        <Button size="xl" onClick={onClose}>
          Listo, ya la entregué
        </Button>
      }
    >
      {data && (
        <div className="flex flex-col gap-4 pb-2">
          <button
            type="button"
            onClick={copy}
            className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            aria-label="Copiar contraseña"
          >
            <span className="font-mono text-2xl font-semibold tracking-wider select-all">
              {data.temporaryPassword}
            </span>
            {copied ? (
              <CheckIcon className="size-5 text-success" />
            ) : (
              <CopyIcon className="size-5 text-muted-foreground" />
            )}
          </button>
          <p className="flex gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
            Al ingresar deberá cambiarla por una propia. Por seguridad no la
            volveremos a mostrar; si se pierde, restablécela.
          </p>
        </div>
      )}
    </ResponsiveSheet>
  )
}
