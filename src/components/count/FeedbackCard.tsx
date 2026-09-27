import {
  CircleAlertIcon,
  CircleHelpIcon,
  MinusIcon,
  PlusIcon,
  ScanLineIcon,
  ShoppingBagIcon,
  Undo2Icon,
} from "lucide-react"

import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCountSession } from "@/hooks/useCountSession"
import type { ScanResult } from "@/lib/api/types"
import { formatNumber, productDetail } from "@/lib/format"
import { cn } from "@/lib/utils"

const STRIPE: Record<ScanResult["status"], string> = {
  ok: "before:bg-success",
  missing: "before:bg-destructive",
  surplus: "before:bg-warning",
  unexpected: "before:bg-info",
}

function statusMessage({ status, expected, counted }: ScanResult) {
  switch (status) {
    case "ok":
      return "¡Cuadrado! Coincide con el sistema."
    case "missing":
      return `Faltan ${formatNumber(expected - counted)} por encontrar.`
    case "surplus":
      return `Hay ${formatNumber(counted - expected)} más de lo que dice el sistema.`
    case "unexpected":
      return "No aparece en las existencias del sistema."
  }
}

const shell =
  "relative flex min-h-40 flex-col justify-center overflow-hidden rounded-3xl bg-card p-5 ring-1 ring-foreground/5 before:absolute before:inset-y-0 before:left-0 before:w-1.5 dark:ring-foreground/10"

export function FeedbackCard() {
  const { feedback, adjust, isOpen, unknownCode } = useCountSession()

  if (!feedback) {
    return (
      <div
        className={cn(shell, "items-center gap-2 text-center before:bg-muted")}
      >
        <ScanLineIcon className="size-8 text-muted-foreground" />
        <p className="font-medium">Apunta la cámara a una etiqueta</p>
        <p className="text-sm text-muted-foreground">
          Cada lectura suma una unidad. Verás aquí cuánto llevas contra lo que
          dice el sistema.
        </p>
      </div>
    )
  }

  if (feedback.kind === "pending") {
    return (
      <div aria-live="polite" className={cn(shell, "gap-2 before:bg-primary")}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner /> Buscando{" "}
          <span className="tabular font-mono">{feedback.code}</span>…
        </div>
      </div>
    )
  }

  if (feedback.kind === "unknown") {
    return (
      <div
        aria-live="assertive"
        className={cn(shell, "gap-2 before:bg-warning")}
      >
        <div className="flex items-center gap-2 font-semibold text-warning">
          <CircleHelpIcon className="size-5" /> Código no registrado
        </div>
        <p className="tabular font-mono text-lg">{feedback.code}</p>
        <p className="text-sm text-muted-foreground">
          {unknownCode
            ? "Asócialo a una referencia o regístralo como producto nuevo."
            : "No se registró. Vuelve a escanearlo si lo necesitas."}
        </p>
      </div>
    )
  }

  if (feedback.kind === "error") {
    return (
      <div role="alert" className={cn(shell, "gap-2 before:bg-destructive")}>
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <CircleAlertIcon className="size-5" /> No se pudo sumar
        </div>
        <p className="text-sm">{feedback.message}</p>
        {feedback.code && (
          <p className="tabular font-mono text-sm text-muted-foreground">
            {feedback.code}
          </p>
        )}
      </div>
    )
  }

  if (feedback.kind === "undo") {
    const { result } = feedback
    const isSale = result.kind === "sale"
    return (
      <div
        aria-live="polite"
        className={cn(shell, "gap-1 before:bg-muted-foreground")}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Undo2Icon className="size-4" />{" "}
          {isSale ? "Venta deshecha" : "Lectura deshecha"}
        </div>
        <p className="font-heading text-lg font-semibold">
          {result.product.name}
        </p>
        <p className="tabular text-sm text-muted-foreground">
          Contadas{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(result.counted)}
          </span>{" "}
          · esperadas{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(result.expected)}
          </span>
        </p>
      </div>
    )
  }

  if (feedback.kind === "sale") {
    const { result } = feedback
    return (
      <div
        key={result.entry.id}
        aria-live="polite"
        className={cn(
          shell,
          "[animation:pop_280ms_ease-out] gap-3 before:bg-info"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-info">
              <ShoppingBagIcon className="size-4" /> Venta registrada
            </div>
            <p className="mt-1 font-heading text-lg leading-snug font-semibold text-balance">
              {result.product.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {productDetail(result.product)}
            </p>
          </div>
          <span className="tabular shrink-0 rounded-full bg-info/15 px-2.5 py-1 font-heading text-lg font-bold text-info">
            −{formatNumber(result.entry.quantity)}
          </span>
        </div>
        <p className="tabular text-sm text-muted-foreground">
          Ahora se esperan{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(result.expected)}
          </span>{" "}
          y hay{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(result.counted)}
          </span>{" "}
          contadas en tienda. Puedes deshacerla en «Últimas lecturas y ventas».
        </p>
      </div>
    )
  }

  const { result, quantity } = feedback
  const { product } = result
  return (
    <div
      key={result.entry.id}
      aria-live="polite"
      className={cn(
        shell,
        STRIPE[result.status],
        "[animation:pop_280ms_ease-out] gap-3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-lg leading-snug font-semibold text-balance">
            {product.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {productDetail(product)}
          </p>
        </div>
        <StatusBadge status={result.status} className="shrink-0" />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="tabular font-heading text-5xl leading-none font-bold tracking-tight">
              {formatNumber(result.counted)}
            </span>
            {result.inBaseline && (
              <span className="tabular text-lg text-muted-foreground">
                de {formatNumber(result.expected)}
              </span>
            )}
            {quantity > 1 && (
              <span className="tabular rounded-full bg-primary/15 px-2 py-0.5 text-sm font-semibold text-foreground">
                +{quantity}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusMessage(result)}
            {result.sold > 0 &&
              ` Descontadas ${formatNumber(result.sold)} vendidas durante el conteo.`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="icon-xl"
            aria-label="Restar una unidad"
            disabled={!isOpen || result.counted <= 0}
            onClick={() => adjust(product, -1)}
          >
            <MinusIcon />
          </Button>
          <Button
            size="icon-xl"
            aria-label="Sumar una unidad"
            disabled={!isOpen}
            onClick={() => adjust(product, 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
