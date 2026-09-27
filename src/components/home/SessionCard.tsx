import { Link } from "@tanstack/react-router"
import {
  ChevronRightIcon,
  GitCompareArrowsIcon,
  ScanBarcodeIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CountSession } from "@/lib/api/types"
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format"

export function SessionCard({ session }: { session: CountSession }) {
  const expected = session.baseline?.totalUnits ?? 0
  const ratio = expected ? Math.min(session.countedUnits / expected, 1) : 0
  const params = { sessionId: String(session.id) }
  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">En curso</span>
        </div>
        <CardTitle className="text-lg">{session.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <span className="tabular font-heading text-3xl font-bold">
              {formatNumber(session.countedUnits)}
            </span>
            {expected > 0 && (
              <span className="text-muted-foreground">
                {" "}
                / {formatNumber(expected)} und
              </span>
            )}
          </div>
          {expected > 0 && (
            <span className="tabular text-sm font-medium text-muted-foreground">
              {formatPercent(ratio)}
            </span>
          )}
        </div>
        {expected > 0 && (
          <Progress value={ratio * 100} aria-label="Avance del conteo" />
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{formatNumber(session.countedProducts)} referencias</span>
          <span>
            {session.lastActivityAt
              ? `Última lectura ${formatRelative(session.lastActivityAt)}`
              : `Creado ${formatDateTime(session.createdAt)}`}
          </span>
          {session.counters.length > 0 && (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3" />
              {session.counters.join(", ")}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild size="xl" className="flex-1">
          <Link to="/conteos/$sessionId" params={params}>
            <ScanBarcodeIcon />
            Continuar
          </Link>
        </Button>
        <Button
          asChild
          size="icon-xl"
          variant="outline"
          aria-label="Ver diferencias"
        >
          <Link to="/conteos/$sessionId/diferencias" params={params}>
            <GitCompareArrowsIcon />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ClosedSessionRow({ session }: { session: CountSession }) {
  return (
    <Link
      to="/conteos/$sessionId/diferencias"
      params={{ sessionId: String(session.id) }}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{session.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(session.createdAt)} ·{" "}
          {formatNumber(session.countedUnits)} und
        </div>
      </div>
      <Badge variant="secondary">Cerrado</Badge>
      <ChevronRightIcon className="size-4 text-muted-foreground" />
    </Link>
  )
}
