import { Badge } from "@/components/ui/badge"
import type { LineStatus } from "@/lib/api/types"
import { STATUS_META } from "@/lib/status"
import { cn } from "@/lib/utils"

const STYLES: Record<LineStatus, string> = {
  ok: "bg-success/15 text-success",
  missing: "bg-destructive/12 text-destructive",
  surplus: "bg-warning/18 text-warning dark:text-warning",
  unexpected: "bg-info/15 text-info",
}

export function StatusBadge({
  status,
  className,
}: {
  status: LineStatus
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(STYLES[status], "font-semibold", className)}
    >
      <span
        className={cn("size-1.5 rounded-full", STATUS_META[status].dot)}
        aria-hidden
      />
      {STATUS_META[status].label}
    </Badge>
  )
}
