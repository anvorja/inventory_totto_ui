import { CheckIcon, TriangleAlertIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useEditProduct } from "@/hooks/useEditProduct"
import type { ImportResult } from "@/lib/api/types"
import { plural } from "@/lib/format"

type Decision = "app" | "excel"

/**
 * Tras subir existencias: productos con el nombre corregido en la app que el Excel trae
 * distinto. Se mantuvo el de la app; aquí se decide si conservarlo o tomar el del Excel.
 */
export function NameConflicts({
  conflicts,
  released,
}: {
  conflicts: ImportResult["nameConflicts"]
  released: number
}) {
  const { can } = useAuth()
  const edit = useEditProduct()
  const [decided, setDecided] = useState<Record<number, Decision>>({})
  const [pendingId, setPendingId] = useState<number | null>(null)
  const canName = can("products.editName")

  if (conflicts.length === 0 && released === 0) return null

  const applyExcelName = (productId: number, excelName: string) => {
    setPendingId(productId)
    edit.mutate(
      { productId, name: excelName },
      {
        onSuccess: () => setDecided((d) => ({ ...d, [productId]: "excel" })),
        onError: (e) => toast.error(e.message),
        onSettled: () => setPendingId(null),
      }
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {conflicts.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl bg-warning/15 p-4">
          <h3 className="flex items-start gap-2 text-sm font-semibold text-warning">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {plural(conflicts.length, "nombre editado", "nombres editados")} en
            la app {conflicts.length === 1 ? "no coincide" : "no coinciden"} con
            el Excel
          </h3>
          <p className="text-sm text-foreground/80">
            Se mantuvo el nombre de la app. Si el del Excel es el correcto,
            úsalo; si no, corrígelo también en el sistema para que coincidan.
          </p>
          <ul className="flex flex-col gap-2">
            {conflicts.map(({ product, excelName }) => {
              const decision = decided[product.id]
              return (
                <li
                  key={product.id}
                  className="flex flex-col gap-2 rounded-xl bg-background p-3 text-sm"
                >
                  {product.reference && (
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {product.reference}
                    </span>
                  )}
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
                    <dt className="text-muted-foreground">App</dt>
                    <dd
                      className={
                        decision === "excel"
                          ? "break-words text-muted-foreground line-through"
                          : "font-medium break-words"
                      }
                    >
                      {product.name}
                    </dd>
                    <dt className="text-muted-foreground">Excel</dt>
                    <dd
                      className={
                        decision === "excel"
                          ? "font-medium break-words"
                          : "break-words text-muted-foreground"
                      }
                    >
                      {excelName}
                    </dd>
                  </dl>
                  {decision ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <CheckIcon className="size-3.5" />
                      {decision === "excel"
                        ? "Ahora usa el nombre del Excel"
                        : "Se mantiene el nombre de la app"}
                    </p>
                  ) : (
                    canName && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1"
                          onClick={() =>
                            setDecided((d) => ({ ...d, [product.id]: "app" }))
                          }
                        >
                          Mantener el de la app
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1"
                          disabled={pendingId === product.id}
                          onClick={() => applyExcelName(product.id, excelName)}
                        >
                          Usar el del Excel
                        </Button>
                      </div>
                    )
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {released > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm text-muted-foreground">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
          {plural(
            released,
            "nombre editado ya coincide",
            "nombres editados ya coinciden"
          )}{" "}
          con el Excel: vuelven a actualizarse solos con cada carga.
        </p>
      )}
    </div>
  )
}
