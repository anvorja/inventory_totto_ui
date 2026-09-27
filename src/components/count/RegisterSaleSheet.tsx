import {
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
} from "lucide-react"
import { useState } from "react"

import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useCountSession } from "@/hooks/useCountSession"
import { useSessionProducts } from "@/hooks/useSessionProducts"
import type { ProductStock } from "@/lib/api/types"
import { formatNumber, productDetail } from "@/lib/format"
import { cn } from "@/lib/utils"

const MAX_QUANTITY = 999

/**
 * Registro de ventas durante el conteo. Se busca por nombre (no se escanea) porque la
 * venta ocurre en caja, lejos del producto; así el reporte atrasado no genera faltantes.
 */
export function RegisterSaleSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Registrar venta"
      description="Busca el producto vendido por nombre, referencia o código de barras."
    >
      {/* key: cada apertura empieza limpia */}
      {open && <SaleForm onDone={() => onOpenChange(false)} />}
    </ResponsiveSheet>
  )
}

function SaleForm({ onDone }: { onDone: () => void }) {
  const { sessionId, registerSale, isSelling } = useCountSession()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ProductStock | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const search = useSessionProducts(sessionId, query)
  const results = search.data ?? []
  const searching = query.trim().length >= 2

  const submit = async () => {
    if (!selected) return
    setError(null)
    try {
      await registerSale(selected.product, quantity)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (selected) {
    const { product } = selected
    const over = selected.inReport && quantity > selected.expected
    return (
      <div className="flex flex-col gap-4 pb-4">
        <button
          type="button"
          onClick={() => {
            setSelected(null)
            setError(null)
          }}
          className="flex w-fit items-center gap-1.5 rounded-xl text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeftIcon className="size-4" /> Cambiar producto
        </button>

        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="font-heading text-lg leading-snug font-semibold text-balance">
            {product.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {productDetail(product)}
          </p>
          <StockLine item={selected} className="mt-2" />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Unidades vendidas</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-xl"
              aria-label="Una unidad menos"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <MinusIcon />
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(
                    MAX_QUANTITY,
                    Math.max(1, Number(e.target.value) || 1)
                  )
                )
              }
              aria-label="Unidades vendidas"
              className="tabular h-12 w-16 rounded-2xl border bg-transparent text-center font-heading text-2xl font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            />
            <Button
              variant="outline"
              size="icon-xl"
              aria-label="Una unidad más"
              disabled={quantity >= MAX_QUANTITY}
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>

        {over && (
          <p className="rounded-2xl bg-warning/15 p-3 text-sm text-warning">
            Estás registrando más unidades de las que se esperan en tienda (
            {formatNumber(selected.expected)}). Revisa la cantidad antes de
            continuar.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button size="xl" onClick={submit} disabled={isSelling}>
          {isSelling ? <Spinner /> : <ShoppingBagIcon />}
          Registrar venta de {formatNumber(quantity)}{" "}
          {quantity === 1 ? "unidad" : "unidades"}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <InputGroup className="h-12 rounded-2xl">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. morral detroit, MA04IND950, 7704682…"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          className="text-base"
          aria-label="Buscar producto vendido"
        />
        {search.isFetching && (
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        )}
      </InputGroup>

      <ul
        className="flex max-h-[50svh] flex-col gap-1 overflow-y-auto"
        role="listbox"
        aria-label="Productos"
      >
        {!searching && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            Escribe al menos 2 letras del nombre del producto.
          </li>
        )}
        {searching && !search.isFetching && results.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            No encontramos productos con «{query.trim()}».
          </li>
        )}
        {searching &&
          results.map((item) => (
            <li key={item.product.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setSelected(item)
                  setQuantity(1)
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {item.product.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {productDetail(item.product)}
                  </div>
                  <StockLine item={item} className="mt-1" />
                </div>
                <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}

function StockLine({
  item,
  className,
}: {
  item: ProductStock
  className?: string
}) {
  if (!item.inReport) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        <Badge variant="outline">No está en existencias</Badge>
        {item.counted > 0 && (
          <span className="tabular text-xs text-muted-foreground">
            {formatNumber(item.counted)} contadas
          </span>
        )}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "tabular flex flex-wrap gap-x-3 text-xs text-muted-foreground",
        className
      )}
    >
      <span>
        Se esperan{" "}
        <span className="font-semibold text-foreground">
          {formatNumber(item.expected)}
        </span>
      </span>
      <span>
        Contadas{" "}
        <span className="font-semibold text-foreground">
          {formatNumber(item.counted)}
        </span>
      </span>
      {item.sold > 0 && (
        <span className="text-info">
          Vendidas en el conteo {formatNumber(item.sold)}
        </span>
      )}
    </div>
  )
}
