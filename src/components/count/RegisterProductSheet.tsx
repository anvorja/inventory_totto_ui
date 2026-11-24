import {
  CheckIcon,
  LinkIcon,
  PackagePlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"

import { ProductDetail } from "@/components/common/ProductDetail"
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { useCountSession } from "@/hooks/useCountSession"
import { useProductSearch } from "@/hooks/useProductSearch"
import type { Product } from "@/lib/api/types"
import { cn } from "@/lib/utils"

/**
 * Aparece cuando se escanea un EAN que no está en el catálogo. Lo más común es que la
 * referencia sí exista (viene en existencias) pero sin código de barras: se asocia y cuenta.
 */
export function RegisterProductSheet() {
  const { unknownCode, dismissUnknown } = useCountSession()
  return (
    <ResponsiveSheet
      open={!!unknownCode}
      onOpenChange={(open) => !open && dismissUnknown()}
      dismissible={false}
      title="Código no registrado"
      description={
        <>
          Leímos{" "}
          <span className="tabular font-mono font-semibold text-foreground">
            {unknownCode}
          </span>
          . ¿A qué producto corresponde?
        </>
      }
    >
      {/* key reinicia el formulario para cada código nuevo */}
      {unknownCode && <RegisterForm key={unknownCode} code={unknownCode} />}
    </ResponsiveSheet>
  )
}

function RegisterForm({ code }: { code: string }) {
  const {
    registerUnknown,
    replaceBarcodeAndCount,
    dismissUnknown,
    isRegistering,
  } = useCountSession()
  const { can } = useAuth()
  const isEan = /^\d{8,14}$/.test(code)
  // Con permiso, un producto que ya tiene otro código se puede elegir para reemplazarlo.
  const canReplace = isEan && can("products.editBarcode")
  const [tab, setTab] = useState<"link" | "new">("link")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Product | null>(null)
  const [name, setName] = useState("")
  const [reference, setReference] = useState(isEan ? "" : code)
  const [error, setError] = useState<string | null>(null)
  const search = useProductSearch(query)
  const candidates = search.data ?? []

  const submit = async () => {
    setError(null)
    try {
      if (tab === "link") {
        if (!selected) return
        if (replaces) {
          await replaceBarcodeAndCount(selected)
          return
        }
        await registerUnknown({
          ean: isEan ? code : null,
          reference: selected.reference,
        })
      } else {
        await registerUnknown({
          ean: isEan ? code : null,
          reference: reference.trim() || null,
          name: name.trim(),
        })
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Reemplazar = el producto ya tiene otro código, o no tiene referencia para asociarlo.
  const replaces = !!selected && (!!selected.ean || !selected.reference)
  const canSubmit =
    tab === "link"
      ? !!selected && (replaces ? canReplace : true)
      : name.trim().length > 1

  return (
    <div className="flex flex-col gap-4 pb-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "link" | "new")}>
        <TabsList className="grid h-10! w-full grid-cols-2">
          <TabsTrigger value="link">
            <LinkIcon /> Asociar
          </TabsTrigger>
          <TabsTrigger value="new">
            <PackagePlusIcon /> Producto nuevo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="mt-2 flex flex-col gap-3">
          <InputGroup className="h-11">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelected(null)
              }}
              placeholder="Busca por nombre o referencia"
              className="text-base"
            />
            {search.isFetching && (
              <InputGroupAddon align="inline-end">
                <Spinner />
              </InputGroupAddon>
            )}
          </InputGroup>
          <ul
            className="flex max-h-[40svh] flex-col gap-1 overflow-y-auto"
            role="listbox"
            aria-label="Resultados"
          >
            {query.trim().length >= 2 &&
              !search.isFetching &&
              candidates.length === 0 && (
                <li className="px-2 py-3 text-sm text-muted-foreground">
                  Sin resultados. Prueba con otra palabra o registra un producto
                  nuevo.
                </li>
              )}
            {candidates.map((p) => {
              const active = selected?.id === p.id
              const taken = !!p.ean
              const selectable = canReplace || (!taken && !!p.reference)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={!selectable}
                    onClick={() => setSelected(p)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
                      active
                        ? "bg-primary/15 ring-1 ring-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-snug font-medium break-words">
                        {p.name}
                      </div>
                      <ProductDetail product={p} />
                    </div>
                    {active ? (
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                    ) : (
                      taken && (
                        <Badge variant="outline" className="shrink-0">
                          {canReplace ? "Tiene otro código" : "Ya tiene código"}
                        </Badge>
                      )
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </TabsContent>

        <TabsContent value="new" className="mt-2 flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="new-name">Nombre del producto</FieldLabel>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-ref">Referencia (opcional)</FieldLabel>
            <Input
              id="new-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="AC53IND398-2510Z-N01"
              className="h-11 font-mono"
            />
            <FieldDescription>
              Está en la etiqueta, encima del código de barras.
            </FieldDescription>
          </Field>
        </TabsContent>
      </Tabs>

      {tab === "link" && selected && replaces && (
        <p className="flex items-start gap-2 rounded-2xl bg-warning/15 p-3 text-sm text-warning">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {selected.ean ? (
              <>
                Este producto tiene el código{" "}
                <span className="tabular font-mono font-semibold">
                  {selected.ean}
                </span>
                . Se reemplazará por{" "}
              </>
            ) : (
              "Se le asignará el código "
            )}
            <span className="tabular font-mono font-semibold">{code}</span>.
          </span>
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="xl"
          className="flex-1"
          onClick={dismissUnknown}
        >
          Omitir
        </Button>
        <Button
          size="xl"
          className="flex-[2]"
          disabled={!canSubmit || isRegistering}
          onClick={submit}
        >
          {isRegistering && <Spinner />}
          {tab === "link"
            ? replaces
              ? "Reemplazar y contar"
              : "Asociar y contar"
            : "Registrar y contar"}
        </Button>
      </div>
    </div>
  )
}
