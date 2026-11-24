import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCountSession } from "@/hooks/useCountSession"

const ZONES = ["Piso de venta", "Bodega", "Vitrina"]

export function ZonePicker() {
  const { zone, setZone } = useCountSession()
  return (
    <div className="flex max-w-full flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Zona
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        value={zone ?? ""}
        onValueChange={(v) => setZone(v || null)}
        aria-label="Zona que estás contando"
      >
        {ZONES.map((z) => (
          <ToggleGroupItem
            key={z}
            value={z}
            className="h-9 px-2.5 whitespace-nowrap data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {z}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
