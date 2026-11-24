import { BarcodeIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ProductDetail } from "@/components/common/ProductDetail"
import { ResponsiveSheet } from "@/components/common/ResponsiveSheet"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useChangeBarcode } from "@/hooks/useChangeBarcode"
import type { Product } from "@/lib/api/types"

const EAN_RE = /^\d{8,14}$/

/**
 * Corrige el código de barras de un producto. Lo usan el administrador y los asesores
 * a quienes él se lo permitió; el servidor valida el permiso y que el código no sea de
 * otro producto, y deja el cambio en el historial.
 */
export function EditBarcodeSheet({
  product,
  onOpenChange,
  onSaved,
}: {
  /** Producto a corregir; null cierra la hoja. */
  product: Product | null
  onOpenChange: (open: boolean) => void
  onSaved?: (product: Product) => void
}) {
  return (
    <ResponsiveSheet
      open={!!product}
      onOpenChange={onOpenChange}
      dismissible={false}
      title="Editar código de barras"
      description="Corrige el código si no coincide con el de la etiqueta."
    >
      {product && (
        <EditBarcodeForm
          key={product.id}
          product={product}
          onCancel={() => onOpenChange(false)}
          onSaved={(saved) => {
            onOpenChange(false)
            onSaved?.(saved)
          }}
        />
      )}
    </ResponsiveSheet>
  )
}

function EditBarcodeForm({
  product,
  onCancel,
  onSaved,
}: {
  product: Product
  onCancel: () => void
  onSaved: (product: Product) => void
}) {
  const change = useChangeBarcode()
  const [value, setValue] = useState(product.ean ?? "")
  const ean = value.replace(/\s/g, "")
  const valid = EAN_RE.test(ean)
  const unchanged = ean === product.ean

  const submit = () => {
    if (!valid || unchanged) return
    change.mutate(
      { productId: product.id, ean },
      {
        onSuccess: (saved) => {
          toast.success("Código de barras actualizado", {
            description: `${saved.name}: ${saved.ean}`,
          })
          onSaved(saved)
        },
      }
    )
  }

  return (
    <form
      className="flex flex-col gap-4 pb-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="leading-snug font-semibold break-words">{product.name}</p>
        <ProductDetail product={product} className="mt-0.5" />
        <p className="tabular mt-2 text-sm text-muted-foreground">
          Código actual:{" "}
          <span className="font-mono font-semibold text-foreground">
            {product.ean ?? "sin código"}
          </span>
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="edit-ean">Código de barras correcto</FieldLabel>
        <InputGroup className="h-12 rounded-2xl">
          <InputGroupAddon>
            <BarcodeIcon />
          </InputGroupAddon>
          <InputGroupInput
            id="edit-ean"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[^\d\s]/g, ""))
              change.reset()
            }}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            maxLength={20}
            aria-invalid={!!ean && !valid}
            className="tabular font-mono text-base"
          />
        </InputGroup>
        <FieldDescription>
          Son los números debajo de las barras en la etiqueta (8 a 14 dígitos).
          Las lecturas ya hechas no cambian.
        </FieldDescription>
      </Field>

      {change.error && (
        <p role="alert" className="text-sm text-destructive">
          {change.error.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="flex-1"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="xl"
          className="flex-[2]"
          disabled={!valid || unchanged || change.isPending}
        >
          {change.isPending && <Spinner />}
          Guardar código
        </Button>
      </div>
    </form>
  )
}
