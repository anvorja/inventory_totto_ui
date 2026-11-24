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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { useEditProduct } from "@/hooks/useEditProduct"
import type { Product } from "@/lib/api/types"

const EAN_RE = /^\d{8,14}$/

/** Mismo criterio que el servidor: sin espacios repetidos ni a los lados. */
const tidy = (name: string) => name.replace(/\s+/g, " ").trim()

/**
 * Corrige un producto. Cada quien ve solo lo que puede cambiar:
 * el nombre (administradores) y el código de barras (administradores y asesores con
 * permiso). El servidor valida lo mismo y deja cada cambio en el historial.
 */
export function EditProductSheet({
  product,
  onOpenChange,
  onSaved,
}: {
  /** Producto a corregir; null cierra la hoja. */
  product: Product | null
  onOpenChange: (open: boolean) => void
  onSaved?: (product: Product) => void
}) {
  const { can } = useAuth()
  const canName = can("products.editName")
  return (
    <ResponsiveSheet
      open={!!product}
      onOpenChange={onOpenChange}
      dismissible={false}
      title={canName ? "Editar producto" : "Editar código de barras"}
      description={
        canName
          ? "Corrige el nombre o el código si no coinciden con la etiqueta."
          : "Corrige el código si no coincide con el de la etiqueta."
      }
    >
      {product && (
        <EditProductForm
          key={product.id}
          product={product}
          canName={canName}
          canEan={can("products.editBarcode")}
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

function EditProductForm({
  product,
  canName,
  canEan,
  onCancel,
  onSaved,
}: {
  product: Product
  canName: boolean
  canEan: boolean
  onCancel: () => void
  onSaved: (product: Product) => void
}) {
  const edit = useEditProduct()
  const [name, setName] = useState(product.name)
  const [code, setCode] = useState(product.ean ?? "")
  const newName = tidy(name)
  const ean = code.replace(/\s/g, "")

  const nameChanged = canName && newName !== product.name
  const eanChanged = canEan && ean !== (product.ean ?? "")
  const nameValid = !canName || newName.length >= 2
  // Dejar el código vacío no lo borra: si el producto no tenía, simplemente no cambia.
  const eanValid = !eanChanged || EAN_RE.test(ean)
  const canSave = (nameChanged || eanChanged) && nameValid && eanValid

  const submit = () => {
    if (!canSave) return
    edit.mutate(
      {
        productId: product.id,
        name: nameChanged ? newName : undefined,
        ean: eanChanged ? ean : undefined,
      },
      {
        onSuccess: (saved) => {
          if (!saved) return
          toast.success(
            nameChanged && eanChanged
              ? "Producto actualizado"
              : nameChanged
                ? "Nombre actualizado"
                : "Código de barras actualizado",
            {
              description: saved.ean
                ? `${saved.name}: ${saved.ean}`
                : saved.name,
            }
          )
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

      {canName && (
        <Field>
          <FieldLabel htmlFor="edit-name">Nombre del producto</FieldLabel>
          <Textarea
            id="edit-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value.replace(/\n/g, " "))
              edit.reset()
            }}
            rows={2}
            maxLength={200}
            autoCapitalize="characters"
            aria-invalid={!nameValid}
            className="min-h-12 resize-none text-base"
          />
          <FieldDescription>
            Las próximas cargas de Excel ya no cambiarán este nombre.
          </FieldDescription>
        </Field>
      )}

      {canEan && (
        <Field>
          <FieldLabel htmlFor="edit-ean">Código de barras correcto</FieldLabel>
          <InputGroup className="h-12 rounded-2xl">
            <InputGroupAddon>
              <BarcodeIcon />
            </InputGroupAddon>
            <InputGroupInput
              id="edit-ean"
              autoFocus={!canName}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/[^\d\s]/g, ""))
                edit.reset()
              }}
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              maxLength={20}
              aria-invalid={!eanValid}
              className="tabular font-mono text-base"
            />
          </InputGroup>
          <FieldDescription>
            Son los números debajo de las barras en la etiqueta (8 a 14
            dígitos). Las lecturas ya hechas no cambian.
          </FieldDescription>
        </Field>
      )}

      {edit.error && (
        <p role="alert" className="text-sm text-destructive">
          {edit.error.message}
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
          disabled={!canSave || edit.isPending}
        >
          {edit.isPending && <Spinner />}
          {canName ? "Guardar cambios" : "Guardar código"}
        </Button>
      </div>
    </form>
  )
}
