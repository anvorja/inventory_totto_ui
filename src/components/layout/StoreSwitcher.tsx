import { CheckIcon, ChevronDownIcon, StoreIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useStore } from "@/hooks/useStore"

export function StoreSwitcher() {
  const { stores, store, selectStore, isLoading } = useStore()

  // Evita mostrar "Sin tienda" por un instante mientras se consulta.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5" aria-label="Cargando tienda">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-4 w-40" />
      </div>
    )
  }

  const label = (
    <span className="flex min-w-0 flex-col items-start leading-tight">
      <span className="text-xs text-muted-foreground">
        {store?.code ?? "Tienda"}
      </span>
      <span className="truncate font-heading text-sm font-semibold">
        {store?.name ?? "Sin tienda"}
      </span>
    </span>
  )

  if (stores.length <= 1) return <div className="min-w-0">{label}</div>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto min-w-0 gap-2 px-2 py-1">
          {label}
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>Punto de venta</DropdownMenuLabel>
        {stores.map((s) => (
          <DropdownMenuItem key={s.id} onSelect={() => selectStore(s.id)}>
            <StoreIcon />
            <span className="flex-1">
              {s.code} · {s.name}
            </span>
            {s.id === store?.id && <CheckIcon />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
