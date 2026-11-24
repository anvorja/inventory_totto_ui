import { PencilLineIcon, Undo2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useEditProduct } from "@/hooks/useEditProduct"
import { useRenamedProducts } from "@/hooks/useRenamedProducts"

/**
 * Nombres corregidos en la app que difieren del sistema. Recuerda corregirlos en el
 * origen y permite volver al nombre del Excel cuando el sistema ya esté bien.
 */
export function RenamedProducts() {
  const { data = [] } = useRenamedProducts()
  const { can } = useAuth()
  const edit = useEditProduct()
  if (data.length === 0) return null

  return (
    <Card size="sm" className="ring-warning/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PencilLineIcon className="size-4 text-warning" />
          Nombres editados · {data.length}
        </CardTitle>
        <CardDescription>
          Se corrigieron en la app y el Excel del sistema trae otro nombre.
          Corrígelos también en el sistema; las cargas de Excel no los cambian.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {data.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-1 border-b py-2.5 text-sm last:border-b-0"
          >
            <span className="leading-snug font-medium break-words">
              {p.name}
            </span>
            {p.reference && (
              <span className="tabular font-mono text-xs text-muted-foreground">
                {p.reference}
              </span>
            )}
            <span className="text-xs break-words text-muted-foreground">
              En el sistema: {p.sourceName ?? "sin nombre del sistema"}
            </span>
            {can("products.editName") && p.sourceName && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 self-start text-muted-foreground pointer-coarse:min-h-11"
                disabled={edit.isPending}
                onClick={() =>
                  edit.mutate(
                    { productId: p.id, name: p.sourceName ?? "" },
                    {
                      onSuccess: () =>
                        toast.success("Volvió al nombre del sistema", {
                          description: p.sourceName ?? undefined,
                        }),
                      onError: (e) => toast.error(e.message),
                    }
                  )
                }
              >
                <Undo2Icon /> Volver al nombre del sistema
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
