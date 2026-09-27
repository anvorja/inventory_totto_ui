import { CheckIcon, ChevronDownIcon, DatabaseIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUpdateSession } from "@/hooks/useSessions"
import { useSnapshots } from "@/hooks/useSnapshots"
import type { CountSession } from "@/lib/api/types"
import { formatDateTime, formatNumber } from "@/lib/format"

/** Contra qué versión del reporte de existencias se compara el conteo (afecta a todo el equipo). */
export function BaselinePicker({
  session,
  readOnly = false,
}: {
  session: CountSession
  /** Asesor: solo ve contra qué existencias se compara. */
  readOnly?: boolean
}) {
  const { snapshots } = useSnapshots(session.store.id)
  const update = useUpdateSession()
  const follows = session.baselineSnapshotId === null

  const choose = (baselineSnapshotId: number | null) =>
    update.mutate(
      { id: session.id, baselineSnapshotId },
      {
        onSuccess: () => toast.success("Comparación actualizada"),
        onError: (e) => toast.error(e.message),
      }
    )

  const label = (
    <span className="truncate">
      {session.baseline
        ? `Existencias ${formatDateTime(session.baseline.effectiveAt)}`
        : "Sin existencias"}
      {follows && session.baseline && " · auto"}
    </span>
  )

  if (readOnly) {
    return (
      <span className="flex h-9 max-w-full items-center gap-1.5 rounded-2xl border px-3 text-sm font-medium [&_svg]:size-4">
        <DatabaseIcon className="shrink-0 text-muted-foreground" />
        {label}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="max-w-full justify-start"
        >
          <DatabaseIcon />
          {label}
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Comparar contra</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => choose(null)}>
          <div className="flex-1">
            <div>Siempre la más reciente</div>
            <div className="text-xs text-muted-foreground">
              Se actualiza al subir un reporte nuevo
            </div>
          </div>
          {follows && <CheckIcon />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {snapshots.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => choose(s.id)}>
            <div className="flex-1">
              <div>{formatDateTime(s.effectiveAt)}</div>
              <div className="text-xs text-muted-foreground">
                {formatNumber(s.totalUnits)} und · {formatNumber(s.lineCount)}{" "}
                ref.
              </div>
            </div>
            {session.baselineSnapshotId === s.id && <CheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
