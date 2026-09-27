import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"

import {
  CountSessionContext,
  type CountFeedback,
  type CountSessionContextValue,
} from "@/contexts/CountSessionContext"
import { useSession } from "@/hooks/useSessions"
import { isApiError } from "@/lib/api/client"
import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"
import type {
  CountEntry,
  CountSession,
  Product,
  ProductInput,
  ScanInput,
} from "@/lib/api/types"
import { feedback as sense } from "@/lib/feedback"

export function CountSessionProvider({
  sessionId,
  children,
}: {
  sessionId: number
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const { data: session, isLoading } = useSession(sessionId)
  const { data: recent = [] } = useQuery({
    queryKey: queryKeys.recent(sessionId),
    queryFn: () => api.sessions.recent(sessionId),
    refetchInterval: 20_000,
  })

  const [feedback, setFeedback] = useState<CountFeedback | null>(null)
  const [unknownCode, setUnknownCode] = useState<string | null>(null)
  const [multiplier, setMultiplier] = useState(1)
  const [zone, setZone] = useState<string | null>(null)
  const scanKey = useMemo(() => ["scan", sessionId] as const, [sessionId])

  /**
   * Refresca totales e historial solo cuando no quedan lecturas en cola; así un refetch
   * lento no pisa lecturas más nuevas que ya se mostraron.
   */
  const refreshAfterChange = useCallback(() => {
    if (queryClient.isMutating({ mutationKey: scanKey }) > 1) return
    queryClient.invalidateQueries({
      queryKey: queryKeys.session(sessionId),
      exact: true,
    })
    queryClient.invalidateQueries({ queryKey: queryKeys.recent(sessionId) })
    // La comparación se recalcula solo cuando alguien la mira.
    queryClient.invalidateQueries({
      queryKey: ["sessions", sessionId, "comparison"],
      refetchType: "none",
    })
  }, [queryClient, scanKey, sessionId])

  /** Aplica un cambio local inmediato al historial y al total del conteo. */
  const applyLocally = useCallback(
    async (update: { add?: CountEntry; removeId?: number; delta: number }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.recent(sessionId) })
      queryClient.setQueryData<CountEntry[]>(
        queryKeys.recent(sessionId),
        (old = []) => {
          const rest = update.removeId
            ? old.filter((e) => e.id !== update.removeId)
            : old
          return update.add ? [update.add, ...rest] : rest
        }
      )
      queryClient.setQueryData<CountSession>(
        queryKeys.session(sessionId),
        (old) =>
          old ? { ...old, countedUnits: old.countedUnits + update.delta } : old
      )
    },
    [queryClient, sessionId]
  )

  const scanMutation = useMutation({
    mutationKey: scanKey,
    // Las lecturas se envían en fila (una tras otra) para conservar orden y totales.
    scope: { id: `scan-${sessionId}` },
    mutationFn: (input: ScanInput) => api.sessions.scan(sessionId, input),
    onSuccess: async (result, input) => {
      await applyLocally({ add: result.entry, delta: result.entry.quantity })
      setFeedback({ kind: "scan", result, quantity: input.quantity ?? 1 })
      if (result.status === "surplus" || result.status === "unexpected")
        sense.warning()
      else sense.success()
    },
    onError: (error, input) => {
      sense.error()
      if (isApiError(error, "product_not_found") && input.code) {
        setUnknownCode(input.code)
        setFeedback({ kind: "unknown", code: input.code })
        return
      }
      setFeedback({ kind: "error", message: error.message, code: input.code })
    },
    onSettled: refreshAfterChange,
  })

  const undoMutation = useMutation({
    mutationKey: scanKey,
    scope: { id: `scan-${sessionId}` },
    mutationFn: (entry: CountEntry) => api.sessions.undo(sessionId, entry.id),
    onSuccess: async ({ product, counted }, entry) => {
      await applyLocally({ removeId: entry.id, delta: -entry.quantity })
      setFeedback({ kind: "undo", product, counted })
    },
    onError: (error) => toast.error(error.message),
    onSettled: refreshAfterChange,
  })

  const registerMutation = useMutation({ mutationFn: api.products.register })

  const base = useCallback(
    // Quién cuenta lo determina el servidor a partir de la sesión.
    () => ({ zone }),
    [zone]
  )

  const scan = useCallback(
    (raw: string) => {
      const code = raw.trim()
      if (!code) return
      if (unknownCode) return // hay un registro pendiente; no mezclar lecturas
      setFeedback({ kind: "pending", code })
      scanMutation.mutate({ code, quantity: multiplier, ...base() })
      if (multiplier !== 1) setMultiplier(1)
    },
    [base, multiplier, scanMutation, unknownCode]
  )

  const adjust = useCallback(
    (product: Product, delta: number) => {
      scanMutation.mutate({ productId: product.id, quantity: delta, ...base() })
    },
    [base, scanMutation]
  )

  const registerUnknown = useCallback(
    async (input: ProductInput) => {
      const product = await registerMutation.mutateAsync(input)
      setUnknownCode(null)
      toast.success(
        product.reference
          ? `Código asociado a ${product.reference}`
          : "Producto registrado"
      )
      scanMutation.mutate({
        productId: product.id,
        quantity: multiplier,
        ...base(),
      })
      setMultiplier(1)
    },
    [base, multiplier, registerMutation, scanMutation]
  )

  const value = useMemo<CountSessionContextValue>(
    () => ({
      sessionId,
      session,
      isLoading,
      isOpen: session?.status === "open",
      recent,
      feedback,
      unknownCode,
      multiplier,
      setMultiplier,
      zone,
      setZone,
      scan,
      adjust,
      undo: (entry) => undoMutation.mutate(entry),
      registerUnknown,
      dismissUnknown: () => setUnknownCode(null),
      isRegistering: registerMutation.isPending,
    }),
    [
      sessionId,
      session,
      isLoading,
      recent,
      feedback,
      unknownCode,
      multiplier,
      zone,
      scan,
      adjust,
      undoMutation,
      registerUnknown,
      registerMutation.isPending,
    ]
  )

  return (
    <CountSessionContext.Provider value={value}>
      {children}
    </CountSessionContext.Provider>
  )
}
