import { KpiTile } from "@/components/common/KpiTile"
import { Progress } from "@/components/ui/progress"
import type { ComparisonSummary } from "@/lib/api/types"
import { formatNumber, formatPercent } from "@/lib/format"
import { STATUS_META } from "@/lib/status"

export function SummaryKpis({ summary }: { summary: ComparisonSummary }) {
  const { buckets } = summary
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="col-span-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/5 md:col-span-4 dark:ring-foreground/10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Exactitud del inventario
            </div>
            <div className="tabular font-heading text-4xl font-bold tracking-tight">
              {formatPercent(summary.accuracy)}
            </div>
          </div>
          <div className="tabular text-right text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">
                {formatNumber(summary.matchedUnits)}
              </span>{" "}
              de {formatNumber(summary.expectedUnits)} und cuadradas
            </div>
            <div>
              {formatNumber(summary.countedUnits)} und contadas en total
            </div>
          </div>
        </div>
        <Progress
          value={summary.accuracy * 100}
          className="mt-3 h-2.5"
          aria-label="Exactitud"
        />
        <div className="mt-2 text-xs text-muted-foreground">
          {formatPercent(summary.progress)} de las referencias esperadas ya
          tiene al menos una unidad contada
        </div>
      </div>
      <KpiTile
        label={STATUS_META.missing.plural}
        value={formatNumber(buckets.missing.units)}
        hint={`und · ${formatNumber(buckets.missing.lines)} ref.`}
        tone={STATUS_META.missing.tone}
      />
      <KpiTile
        label={STATUS_META.surplus.plural}
        value={formatNumber(buckets.surplus.units)}
        hint={`und · ${formatNumber(buckets.surplus.lines)} ref.`}
        tone={STATUS_META.surplus.tone}
      />
      <KpiTile
        label={STATUS_META.unexpected.plural}
        value={formatNumber(buckets.unexpected.units)}
        hint={`und · ${formatNumber(buckets.unexpected.lines)} ref.`}
        tone={STATUS_META.unexpected.tone}
      />
      <KpiTile
        label={STATUS_META.ok.plural}
        value={formatNumber(buckets.ok.lines)}
        hint="referencias exactas"
        tone={STATUS_META.ok.tone}
      />
    </div>
  )
}
