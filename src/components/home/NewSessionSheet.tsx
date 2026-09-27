import { useNavigate } from "@tanstack/react-router"
import { PlayIcon } from "lucide-react"
import { useState } from "react"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useCreateSession } from "@/hooks/useSessions"
import { useSnapshots } from "@/hooks/useSnapshots"
import { useStore } from "@/hooks/useStore"
import { defaultSessionName, formatDateTime, formatNumber } from "@/lib/format"

export function NewSessionSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { store } = useStore()
  const { latest } = useSnapshots(store?.id)
  const [name, setName] = useState(defaultSessionName)
  const create = useCreateSession()
  const navigate = useNavigate()

  const submit = () => {
    if (!store || !name.trim()) return
    create.mutate(
      { storeId: store.id, name: name.trim() },
      {
        onSuccess: (session) => {
          onOpenChange(false)
          navigate({
            to: "/conteos/$sessionId",
            params: { sessionId: String(session.id) },
          })
        },
      }
    )
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo conteo"
      description={store ? `${store.code} · ${store.name}` : undefined}
      footer={
        <Button
          size="xl"
          onClick={submit}
          disabled={!name.trim() || create.isPending}
        >
          {create.isPending ? <Spinner /> : <PlayIcon />}
          Empezar a contar
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field>
          <FieldLabel htmlFor="session-name">Nombre del conteo</FieldLabel>
          <Input
            id="session-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="h-11"
          />
          <FieldDescription>
            Varias personas pueden contar a la vez en el mismo conteo desde sus
            celulares.
          </FieldDescription>
        </Field>
        <div className="rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
          {latest ? (
            <>
              Se comparará con las existencias más recientes (
              <span className="font-medium text-foreground">
                {formatDateTime(latest.effectiveAt)}
              </span>
              , {formatNumber(latest.totalUnits)} und). Si subes un reporte
              nuevo mientras cuentas, la comparación se actualiza sola.
            </>
          ) : (
            "Aún no hay existencias cargadas: puedes contar igual y subir el reporte después."
          )}
        </div>
        {create.error && (
          <p className="text-sm text-destructive">{create.error.message}</p>
        )}
      </form>
    </ResponsiveSheet>
  )
}
