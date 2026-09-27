import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function KpiTile({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-4 ring-1 ring-foreground/5 dark:ring-foreground/10",
        className
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tabular mt-1 font-heading text-2xl font-bold tracking-tight",
          tone
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  )
}
