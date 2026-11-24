import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"

/** Corrige el código de barras de un producto y refresca donde se muestra. */
export function useChangeBarcode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, ean }: { productId: number; ean: string }) =>
      api.products.changeEan(productId, ean),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      // Historial, comparación y búsquedas del conteo muestran datos del producto.
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}
