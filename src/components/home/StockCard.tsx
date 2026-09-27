import {
  ClockIcon,
  DatabaseIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Snapshot } from "@/lib/api/types"
import {
  formatDateTime,
  formatNumber,
  formatRelative,
  hoursSince,
} from "@/lib/format"

/** El reporte se actualiza ~2 veces al día; pasadas 8 h se sugiere recargarlo. */
const STALE_AFTER_HOURS = 8

export function StockCard({
  snapshot,
  isLoading,
  onImport,
}: {
  snapshot: Snapshot | null
  isLoading: boolean
  /** Sin esta función (asesor) no se muestra el botón de actualizar. */
  onImport?: () => void
}) {
  const stale = snapshot
    ? hoursSince(snapshot.effectiveAt) > STALE_AFTER_HOURS
    : false
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="size-4 text-muted-foreground" />
          Existencias del sistema
        </CardTitle>
        <CardDescription>Lo que la tienda debería tener</CardDescription>
        <CardAction>
          {onImport && (
            <Button variant="outline" size="lg" onClick={onImport}>
              <RefreshCwIcon />
              Actualizar
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : snapshot ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="tabular font-heading text-3xl font-bold tracking-tight">
                  {formatNumber(snapshot.totalUnits)}
                </div>
                <div className="text-xs text-muted-foreground">unidades</div>
              </div>
              <div>
                <div className="tabular font-heading text-3xl font-bold tracking-tight">
                  {formatNumber(snapshot.lineCount)}
                </div>
                <div className="text-xs text-muted-foreground">referencias</div>
              </div>
            </div>
            <div
              className={
                stale
                  ? "flex items-center gap-2 rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning"
                  : "flex items-center gap-2 text-sm text-muted-foreground"
              }
            >
              {stale ? (
                <TriangleAlertIcon className="size-4 shrink-0" />
              ) : (
                <ClockIcon className="size-4 shrink-0" />
              )}
              <span>
                Reporte de {formatDateTime(snapshot.effectiveAt)} (
                {formatRelative(snapshot.effectiveAt)})
                {stale && ". Podría estar desactualizado."}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no hay existencias cargadas para esta tienda.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
