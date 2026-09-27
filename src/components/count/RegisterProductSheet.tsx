import { CheckIcon, LinkIcon, PackagePlusIcon, SearchIcon } from "lucide-react"
import { useState } from "react"

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
import { useCountSession } from "@/hooks/useCountSession"
import { useProductSearch } from "@/hooks/useProductSearch"
import type { Product } from "@/lib/api/types"
import { productDetail } from "@/lib/format"
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
  const { registerUnknown, dismissUnknown, isRegistering } = useCountSession()
  const isEan = /^\d{8,14}$/.test(code)
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

  const canSubmit =
    tab === "link" ? !!selected?.reference : name.trim().length > 1

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
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={taken || !p.reference}
                    onClick={() => setSelected(p)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
                      active
                        ? "bg-primary/15 ring-1 ring-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {productDetail(p)}
                      </div>
                    </div>
                    {taken ? (
                      <Badge variant="outline">Ya tiene código</Badge>
                    ) : (
                      active && <CheckIcon className="size-4 text-primary" />
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
          {tab === "link" ? "Asociar y contar" : "Registrar y contar"}
        </Button>
      </div>
    </div>
  )
}
