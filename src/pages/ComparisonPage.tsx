import { Link, useNavigate } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  DownloadIcon,
  InfoIcon,
  ScanBarcodeIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react"
import { useDeferredValue, useMemo, useState } from "react"
import { toast } from "sonner"

import { QueryError } from "@/components/common/QueryError"
import { BaselinePicker } from "@/components/compare/BaselinePicker"
import { DiffList } from "@/components/compare/DiffList"
import { SummaryKpis } from "@/components/compare/SummaryKpis"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useComparison, useExportComparison } from "@/hooks/useComparison"
import { useSession } from "@/hooks/useSessions"
import type { LineStatus } from "@/lib/api/types"
import { formatNumber } from "@/lib/format"
import { STATUS_META, STATUS_ORDER } from "@/lib/status"
import { cn } from "@/lib/utils"

export type StatusFilter = LineStatus | "all"

export function ComparisonPage({
  sessionId,
  status,
}: {
  sessionId: number
  status: StatusFilter
}) {
  const navigate = useNavigate()
  const { data: session, error: sessionError } = useSession(sessionId)
  const { data, isLoading, isFetching, error, refetch } =
    useComparison(sessionId)
  const exportXlsx = useExportComparison()
  const { can } = useAuth()
  const [query, setQuery] = useState("")
  const [unit, setUnit] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const setStatus = (next: StatusFilter) =>
    navigate({
      to: "/conteos/$sessionId/diferencias",
      params: { sessionId: String(sessionId) },
      search: { estado: next },
      replace: true,
    })

  const units = useMemo(
    () =>
      [
        ...new Set(
          (data?.lines ?? [])
            .map((l) => l.businessUnit)
            .filter(Boolean) as string[]
        ),
      ].sort(),
    [data]
  )

  const visible = useMemo(() => {
    const lines = data?.lines ?? []
    return lines.filter((l) => {
      if (status !== "all" && l.status !== status) return false
      if (unit && l.businessUnit !== unit) return false
      if (!deferredQuery) return true
      return (
        l.name.toLowerCase().includes(deferredQuery) ||
        l.reference?.toLowerCase().includes(deferredQuery) ||
        l.ean?.includes(deferredQuery) ||
        l.colorName?.toLowerCase().includes(deferredQuery)
      )
    })
  }, [data, status, unit, deferredQuery])

  if (sessionError) return <QueryError error={sessionError} />
  if (error) return <QueryError error={error} onRetry={refetch} />

  const params = { sessionId: String(sessionId) }
  const counts: Record<StatusFilter, number> = {
    all: data?.lines.length ?? 0,
    ...Object.fromEntries(
      STATUS_ORDER.map((s) => [s, data?.summary.buckets[s].lines ?? 0])
    ),
  } as Record<StatusFilter, number>

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-start gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          aria-label="Volver al conteo"
        >
          <Link to="/conteos/$sessionId" params={params}>
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">
            Diferencias
          </div>
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            {session?.name ?? "…"}
          </h1>
        </div>
        {can("sessions.export") && (
          <Button
            size="lg"
            variant="outline"
            disabled={exportXlsx.isPending || !data}
            onClick={() =>
              exportXlsx.mutate(
                { sessionId },
                {
                  onSuccess: () => toast.success("Excel descargado"),
                  onError: (e) => toast.error(e.message),
                }
              )
            }
          >
            {exportXlsx.isPending ? <Spinner /> : <DownloadIcon />}
            <span className="hidden sm:inline">Exportar</span> Excel
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {session && (
          <BaselinePicker
            session={session}
            readOnly={!can("sessions.baseline")}
          />
        )}
        {session?.status === "open" && (
          <Badge variant="secondary" className="h-8 gap-1.5 px-3">
            <span className="size-1.5 rounded-full bg-success" /> En curso · se
            actualiza al contar
          </Badge>
        )}
        {isFetching && !isLoading && (
          <Spinner className="text-muted-foreground" />
        )}
      </div>

      {isLoading || !data ? (
        <div className="grid gap-3">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !data.snapshot ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InfoIcon />
            </EmptyMedia>
            <EmptyTitle>No hay existencias para comparar</EmptyTitle>
            <EmptyDescription>
              Sube el reporte de existencias desde Inicio para ver faltantes y
              sobrantes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <SummaryKpis summary={data.summary} />

          {data.summary.linesWithoutEan > 0 && (
            <div className="flex gap-3 rounded-2xl bg-warning/12 p-3 text-sm">
              <ScanBarcodeIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>
                <span className="font-semibold">
                  {formatNumber(data.summary.linesWithoutEan)} referencias no
                  tienen código de barras
                </span>{" "}
                en el maestro. Al escanear su etiqueta, la app te pedirá
                asociarla y quedará registrada para los próximos conteos.
              </p>
            </div>
          )}

          <div className="sticky top-16 z-30 -mx-4 flex flex-col gap-2 bg-background/90 px-4 py-2 backdrop-blur-lg md:-mx-6 md:px-6">
            <div
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
              role="tablist"
              aria-label="Filtrar por estado"
            >
              {(
                [
                  "missing",
                  "surplus",
                  "unexpected",
                  "ok",
                  "all",
                ] as StatusFilter[]
              ).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    status === s
                      ? "border-foreground bg-foreground text-background"
                      : "hover:bg-muted"
                  )}
                >
                  {s !== "all" && (
                    <span
                      className={cn("size-2 rounded-full", STATUS_META[s].dot)}
                    />
                  )}
                  {s === "all" ? "Todas" : STATUS_META[s].plural}
                  <span className="tabular text-xs opacity-70">
                    {formatNumber(counts[s])}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <InputGroup className="h-11 sm:flex-1">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar nombre, referencia, EAN o color"
                  className="text-base"
                  type="search"
                />
              </InputGroup>
              {units.length > 1 && (
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
                  {[null, ...units].map((u) => (
                    <button
                      key={u ?? "all"}
                      onClick={() => setUnit(u)}
                      className={cn(
                        "h-11 shrink-0 rounded-2xl border px-3 text-xs font-medium whitespace-nowrap transition-colors",
                        unit === u
                          ? "border-primary bg-primary/15"
                          : "hover:bg-muted"
                      )}
                    >
                      {u
                        ? u.charAt(0) + u.slice(1).toLowerCase()
                        : "Todas las UND"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            {formatNumber(visible.length)} referencias
            {status !== "all" && ` · ${STATUS_META[status].hint.toLowerCase()}`}
          </p>

          {visible.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>Nada por aquí</EmptyTitle>
                <EmptyDescription>
                  {query || unit
                    ? "Prueba con otro filtro o búsqueda."
                    : "No hay referencias en este estado."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DiffList lines={visible} />
          )}
        </>
      )}
    </div>
  )
}
