import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import type { Product } from "@/lib/api/types"

/**
 * Corrige el nombre y/o el código de barras de un producto y refresca donde se muestra.
 * Solo envía lo que cambió; el servidor valida el permiso de cada campo.
 */
export function useEditProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      name,
      ean,
    }: {
      productId: number
      name?: string
      ean?: string
    }): Promise<Product | undefined> => {
      let saved: Product | undefined
      if (name !== undefined) saved = await api.products.rename(productId, name)
      if (ean !== undefined)
        saved = await api.products.changeEan(productId, ean)
      return saved
    },
    // También si falla el segundo cambio: el primero pudo quedar guardado.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      // Historial, comparación y búsquedas del conteo muestran datos del producto.
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}
