import { HistoryIcon, ShoppingBagIcon, Undo2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useCountSession } from "@/hooks/useCountSession"
import { formatSigned, formatWhen } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RecentScans() {
  const { recent, undo, isOpen } = useCountSession()
  const { user, can } = useAuth()
  // Un asesor solo deshace lo suyo; el administrador puede corregir cualquier lectura.
  const canUndo = (userId: number | null) =>
    isOpen && (can("entries.undoAny") || userId === user?.id)

  return (
    <Card size="sm" className="gap-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <HistoryIcon className="size-4 text-muted-foreground" /> Últimas
          lecturas y ventas
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {recent.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Aún no hay lecturas en este conteo.
          </p>
        ) : (
          <ul className="flex flex-col">
            {recent.slice(0, 15).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl px-2 py-2"
              >
                <span
                  className={cn(
                    "tabular flex h-8 min-w-10 items-center justify-center gap-1 rounded-xl px-1.5 text-sm font-bold",
                    entry.kind === "sale"
                      ? "bg-info/15 text-info"
                      : entry.quantity > 0
                        ? "bg-success/15 text-success"
                        : "bg-destructive/12 text-destructive"
                  )}
                  title={entry.kind === "sale" ? "Venta" : "Lectura"}
                >
                  {entry.kind === "sale" ? (
                    <>
                      <ShoppingBagIcon className="size-3.5" />−{entry.quantity}
                    </>
                  ) : (
                    formatSigned(entry.quantity)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {entry.product.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {formatWhen(entry.createdAt)}
                    {entry.countedBy && ` · ${entry.countedBy}`}
                    {entry.zone && ` · ${entry.zone}`}
                    {entry.product.reference && ` · ${entry.product.reference}`}
                  </div>
                </div>
                {canUndo(entry.userId) ? (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Deshacer ${entry.kind === "sale" ? "venta" : "lectura"} de ${entry.product.name}`}
                    onClick={() => undo(entry)}
                  >
                    <Undo2Icon />
                  </Button>
                ) : (
                  <span className="size-9" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
