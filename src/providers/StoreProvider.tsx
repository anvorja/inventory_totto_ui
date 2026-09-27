import { useQuery } from "@tanstack/react-query"
import { useMemo, useState, type ReactNode } from "react"

import { StoreContext, type StoreContextValue } from "@/contexts/StoreContext"
import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"
import { readPreference, writePreference } from "@/lib/preferences"

const STORAGE_KEY = "conteo-totto:store"

export function StoreProvider({ children }: { children: ReactNode }) {
  const {
    data: stores = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.stores,
    queryFn: api.stores.list,
  })
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = Number(readPreference(STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : null
  })

  const value = useMemo<StoreContextValue>(() => {
    const store = stores.find((s) => s.id === selectedId) ?? stores[0] ?? null
    return {
      stores,
      store,
      isLoading,
      error,
      selectStore: (id) => {
        writePreference(STORAGE_KEY, String(id))
        setSelectedId(id)
      },
    }
  }, [stores, selectedId, isLoading, error])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
