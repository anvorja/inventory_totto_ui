import { cn } from "@/lib/utils"

interface Props {
  product: {
    reference: string | null
    colorName: string | null
    size: string | null
  }
  className?: string
}

/**
 * Referencia · color · talla. Cada parte baja de línea entera: así una referencia como
 * ET17BZY007-2616-N01S no se parte por los guiones en pantallas angostas.
 */
export function ProductDetail({ product, className }: Props) {
  const parts = [
    product.reference,
    product.colorName,
    product.size && `Talla ${product.size}`,
  ].filter((p): p is string => !!p)
  if (parts.length === 0) return null
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && " · "}
          <span className="whitespace-nowrap">{part}</span>
        </span>
      ))}
    </p>
  )
}
