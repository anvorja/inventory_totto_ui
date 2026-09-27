import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCountSession } from "@/hooks/useCountSession"

const ZONES = ["Piso de venta", "Bodega", "Vitrina"]

export function ZonePicker() {
  const { zone, setZone } = useCountSession()
  return (
    <div className="flex max-w-full items-center gap-2 overflow-x-auto">
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
            className="h-9 px-3 whitespace-nowrap data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {z}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
