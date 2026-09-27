import {
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  InfoIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react"
import { useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useImportXlsx } from "@/hooks/useImportXlsx"
import { useStore } from "@/hooks/useStore"
import type { ImportResult } from "@/lib/api/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

/** El export del sistema trae la hora en el nombre: "data - 2026-09-26T101702.972.xlsx". */
function timestampFromFilename(name: string): string | null {
  const m = /(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})?/.exec(name)
  return m ? `${m[1]}T${m[2]}:${m[3]}` : null
}

function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function ImportSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [effectiveAt, setEffectiveAt] = useState(nowLocal)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const importXlsx = useImportXlsx()
  const { selectStore } = useStore()

  const reset = () => {
    setFile(null)
    setResult(null)
    setEffectiveAt(nowLocal())
    importXlsx.reset()
  }

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!/\.xlsx$/i.test(f.name)) {
      toast.error("Solo se aceptan archivos Excel .xlsx")
      return
    }
    setFile(f)
    setResult(null)
    importXlsx.reset()
    setEffectiveAt(timestampFromFilename(f.name) ?? nowLocal())
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  const submit = () => {
    if (!file) return
    importXlsx.mutate(
      { file, effectiveAt: new Date(effectiveAt).toISOString() },
      {
        onSuccess: (data) => {
          setResult(data)
          const first = data.snapshots[0]
          if (first) selectStore(first.store.id)
        },
      }
    )
  }

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) setTimeout(reset, 300)
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={close}
      title="Actualizar desde Excel"
      description="Sube el reporte de existencias del sistema o el maestro de códigos de barras. Detectamos el tipo automáticamente."
      footer={
        result ? (
          <Button size="xl" onClick={() => close(false)}>
            Listo
          </Button>
        ) : (
          <Button
            size="xl"
            disabled={!file || importXlsx.isPending}
            onClick={submit}
          >
            {importXlsx.isPending ? <Spinner /> : <UploadIcon />}
            {importXlsx.isPending ? "Procesando…" : "Subir archivo"}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {result ? (
          <ImportSummary result={result} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex min-h-36 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                dragging ? "border-primary bg-primary/10" : "hover:bg-muted/60",
                file && "border-solid border-primary/60 bg-primary/5"
              )}
            >
              <FileSpreadsheetIcon
                className={cn(
                  "size-8",
                  file ? "text-primary" : "text-muted-foreground"
                )}
              />
              {file ? (
                <>
                  <span className="max-w-full truncate font-medium">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB · toca para cambiar
                  </span>
                </>
              ) : (
                <>
                  <span className="font-medium">Elegir archivo .xlsx</span>
                  <span className="text-xs text-muted-foreground">
                    Desde descargas, Drive o el correo
                  </span>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files?.[0])
                e.target.value = ""
              }}
            />
            <Field>
              <FieldLabel htmlFor="effective-at">
                Hora del reporte de existencias
              </FieldLabel>
              <Input
                id="effective-at"
                type="datetime-local"
                value={effectiveAt}
                max={nowLocal()}
                onChange={(e) => setEffectiveAt(e.target.value)}
                className="h-11"
              />
              <FieldDescription>
                La tomamos del nombre del archivo cuando viene incluida. Sirve
                para saber contra qué versión se compara cada conteo.
              </FieldDescription>
            </Field>
            {importXlsx.error && (
              <div
                role="alert"
                className="flex gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive"
              >
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                {importXlsx.error.message}
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveSheet>
  )
}

function ImportSummary({ result }: { result: ImportResult }) {
  if (result.catalog) {
    const c = result.catalog
    return (
      <SummaryBox title="Maestro de códigos actualizado">
        <li>{formatNumber(c.total)} códigos leídos</li>
        <li>
          {formatNumber(c.created)} nuevos · {formatNumber(c.updated)}{" "}
          actualizados · {formatNumber(c.unchanged)} sin cambios
        </li>
        {c.columnsSwapped && (
          <li className="text-warning">
            Los encabezados venían invertidos (BARCODE con referencias y SKU con
            códigos de barras). Los corregimos al leer; renombra las columnas en
            el Excel: BARCODE = EAN-13, SKU = Código Producto Largo.
          </li>
        )}
        {c.conflicts > 0 && (
          <li className="text-warning">
            {formatNumber(c.conflicts)} referencias ya tenían otro código y no
            se modificaron
          </li>
        )}
      </SummaryBox>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {result.snapshots.map((s) => (
        <SummaryBox
          key={s.snapshot.id}
          title={
            s.duplicate
              ? `${s.store.code}: este archivo ya se había cargado`
              : `Existencias de ${s.store.code} cargadas`
          }
          tone={s.duplicate ? "info" : "success"}
        >
          <li>
            {formatNumber(s.snapshot.lineCount)} referencias ·{" "}
            {formatNumber(s.snapshot.totalUnits)} unidades esperadas
          </li>
          {s.newProducts > 0 && (
            <li>
              {formatNumber(s.newProducts)} referencias nuevas en el catálogo
            </li>
          )}
          {s.linesWithoutEan > 0 && (
            <li className="text-warning">
              {formatNumber(s.linesWithoutEan)} referencias sin código de
              barras: si las escaneas, la app te pedirá asociarlas.
            </li>
          )}
        </SummaryBox>
      ))}
    </div>
  )
}

function SummaryBox({
  title,
  children,
  tone = "success",
}: {
  title: string
  children: React.ReactNode
  tone?: "success" | "info"
}) {
  const Icon = tone === "success" ? CheckCircle2Icon : InfoIcon
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <div className="flex items-center gap-2 font-medium">
        <Icon
          className={cn(
            "size-5",
            tone === "success" ? "text-success" : "text-info"
          )}
        />
        {title}
      </div>
      <ul className="mt-2 flex list-none flex-col gap-1 pl-7 text-sm text-muted-foreground">
        {children}
      </ul>
    </div>
  )
}
