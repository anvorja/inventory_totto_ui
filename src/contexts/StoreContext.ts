import { createContext } from "react"

import type { StoreOverview } from "@/lib/api/types"

export interface StoreContextValue {
  stores: StoreOverview[]
  /** Tienda activa. `null` mientras carga o si aún no se ha importado ninguna. */
  store: StoreOverview | null
  selectStore: (storeId: number) => void
  isLoading: boolean
  error: Error | null
}

export const StoreContext = createContext<StoreContextValue | undefined>(
  undefined
)
