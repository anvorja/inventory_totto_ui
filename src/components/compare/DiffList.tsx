import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { BarcodeIcon, ScanBarcodeIcon } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { StatusBadge } from "@/components/common/StatusBadge"
import type { ComparisonLine } from "@/lib/api/types"
import { formatNumber, formatSigned, productDetail } from "@/lib/format"
import { STATUS_META } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Lista virtualizada: fluida con miles de referencias incluso en celulares modestos. */
export function DiffList({ lines }: { lines: ComparisonLine[] }) {
  const listRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  // La lista empieza debajo de KPIs y filtros, cuya altura puede cambiar.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (Math.abs(top - offset) > 1) setOffset(top)
  }, [offset, lines])

  const virtualizer = useWindowVirtualizer({
    count: lines.length,
    estimateSize: () => 76,
    overscan: 8,
    scrollMargin: offset,
  })

  return (
    <div
      ref={listRef}
      className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/5 dark:ring-foreground/10"
    >
      <div className="hidden grid-cols-[minmax(0,1fr)_5rem_5rem_5.5rem_7rem] gap-3 border-b px-5 py-2.5 text-xs font-medium text-muted-foreground lg:grid">
        <span>Producto</span>
        <span className="text-right">Esperado</span>
        <span className="text-right">Contado</span>
        <span className="text-right">Diferencia</span>
        <span className="text-right">Estado</span>
      </div>
      <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const line = lines[item.index]
          return (
            <div
              key={line.productId}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0"
              style={{
                transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <DiffRow line={line} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiffRow({ line }: { line: ComparisonLine }) {
  const tone =
    line.difference === 0
      ? "text-muted-foreground"
      : STATUS_META[line.status].tone
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 lg:grid lg:grid-cols-[minmax(0,1fr)_5rem_5rem_5.5rem_7rem] lg:px-5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{line.name}</div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{productDetail(line)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs">
          {line.ean ? (
            <span className="tabular flex items-center gap-1 font-mono text-muted-foreground">
              <BarcodeIcon className="size-3" />
              {line.ean}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-warning">
              <ScanBarcodeIcon className="size-3" /> Sin código de barras
            </span>
          )}
        </div>
      </div>

      {/* Móvil/tablet vertical: resumen compacto */}
      <div className="flex shrink-0 flex-col items-end gap-1 lg:hidden">
        <span className={cn("tabular font-heading text-xl font-bold", tone)}>
          {formatSigned(line.difference)}
        </span>
        <span className="tabular text-xs text-muted-foreground">
          {formatNumber(line.counted)} / {formatNumber(line.expected)}
        </span>
        {line.sold > 0 && <SoldNote line={line} />}
      </div>

      {/* Tablet horizontal / escritorio: columnas */}
      <span className="tabular hidden text-right lg:block">
        {formatNumber(line.expected)}
        {line.sold > 0 && <SoldNote line={line} />}
      </span>
      <span className="tabular hidden text-right font-medium lg:block">
        {formatNumber(line.counted)}
      </span>
      <span
        className={cn(
          "tabular hidden text-right font-heading text-lg font-bold lg:block",
          tone
        )}
      >
        {formatSigned(line.difference)}
      </span>
      <span className="hidden justify-end lg:flex">
        <StatusBadge status={line.status} />
      </span>
    </div>
  )
}

/** "reporte 3 − 1 vendida": explica por qué lo esperado es menor que el reporte. */
function SoldNote({ line }: { line: ComparisonLine }) {
  return (
    <span
      className="tabular block text-[11px] leading-tight text-info"
      title="Vendidas durante el conteo, ya descontadas de lo esperado"
    >
      rep. {formatNumber(line.reported)} − {formatNumber(line.sold)} vend.
    </span>
  )
}
