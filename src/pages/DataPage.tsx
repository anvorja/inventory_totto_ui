import {
  BarcodeIcon,
  FileSpreadsheetIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/PageHeader"
import { ImportSheet } from "@/components/data/ImportSheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/useAuth"
import { useProductSearch } from "@/hooks/useProductSearch"
import { useDeleteSnapshot, useSnapshots } from "@/hooks/useSnapshots"
import { useStore } from "@/hooks/useStore"
import type { Snapshot } from "@/lib/api/types"
import {
  formatDateTime,
  formatNumber,
  formatRelative,
  productDetail,
} from "@/lib/format"

export function DataPage() {
  const { store } = useStore()
  const { snapshots, isLoading } = useSnapshots(store?.id)
  const remove = useDeleteSnapshot()
  const { can } = useAuth()
  const [importOpen, setImportOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Snapshot | null>(null)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Existencias"
        description="Cada Excel que subes queda guardado como una versión. Los conteos se comparan contra la más reciente, o la que elijas."
        actions={
          can("imports.upload") && (
            <Button size="xl" onClick={() => setImportOpen(true)}>
              <UploadIcon /> Subir Excel
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Historial de reportes</CardTitle>
            <CardDescription>
              {store ? `${store.code} · ${store.name}` : "Sin tienda"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 px-3">
            {isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : snapshots.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Aún no has subido reportes de existencias.
              </p>
            ) : (
              snapshots.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-muted/60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileSpreadsheetIcon className="size-5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatDateTime(s.effectiveAt)}
                      </span>
                      {i === 0 && <Badge>Más reciente</Badge>}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {formatNumber(s.totalUnits)} und ·{" "}
                      {formatNumber(s.lineCount)} ref. · subido{" "}
                      {formatRelative(s.createdAt)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.sourceFilename}
                    </div>
                  </div>
                  {can("snapshots.delete") && (
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={`Eliminar reporte de ${formatDateTime(s.effectiveAt)}`}
                      onClick={() => setToDelete(s)}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <ProductLookup />
          <Card size="sm">
            <CardHeader>
              <CardTitle>¿Qué archivos acepta?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  Reporte de existencias:
                </span>{" "}
                columnas Punto de Venta, Código Producto Largo, Disponible (y
                opcionalmente UND, Nombre, Talla, Color). Súbelo cada vez que el
                sistema lo actualice.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Maestro de códigos de barras:
                </span>{" "}
                columnas BARCODE (el EAN-13 de la etiqueta), Código Producto
                Largo o SKU (la referencia) y NOMBRE PRODUCTO. Súbelo cuando
                lleguen productos nuevos. Si los encabezados vienen invertidos,
                lo detectamos y te avisamos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este reporte?</AlertDialogTitle>
            <AlertDialogDescription>
              Los conteos que usan "la más reciente" pasarán a compararse con la
              versión anterior. No se borra ninguna lectura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                toDelete &&
                remove.mutate(toDelete.id, {
                  onSuccess: () => toast.success("Reporte eliminado"),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductLookup() {
  const [query, setQuery] = useState("")
  const { data = [], isFetching } = useProductSearch(query)
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Buscar en el catálogo</CardTitle>
        <CardDescription>
          Por nombre, referencia o código de barras
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <InputGroup className="h-11">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. morral, AC53IND398, 7704682…"
            type="search"
            className="text-base"
          />
          {isFetching && (
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          )}
        </InputGroup>
        <ul className="flex max-h-80 flex-col overflow-y-auto">
          {data.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl px-1 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {productDetail(p)}
                </div>
              </div>
              {p.ean ? (
                <span className="tabular flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <BarcodeIcon className="size-3" />
                  {p.ean}
                </span>
              ) : (
                <Badge variant="outline" className="text-warning">
                  Sin código
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
