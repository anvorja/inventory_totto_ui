import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"

/** Productos con el nombre corregido en la app, para revisarlos contra el sistema. */
export function useRenamedProducts() {
  return useQuery({
    queryKey: queryKeys.renamedProducts,
    queryFn: api.products.renamed,
  })
}
