import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"
import type { CountSession } from "@/lib/api/types"

export function useSessions(storeId: number | undefined) {
  const query = useQuery({
    queryKey: queryKeys.sessions(storeId ?? 0),
    queryFn: () => api.stores.sessions(storeId!),
    enabled: !!storeId,
  })
  const sessions = query.data ?? []
  return {
    ...query,
    sessions,
    openSessions: sessions.filter((s) => s.status === "open"),
    closedSessions: sessions.filter((s) => s.status === "closed"),
    /** Conteo abierto con actividad más reciente: destino de "Contar". */
    activeSession:
      [...sessions]
        .filter((s) => s.status === "open")
        .sort((a, b) =>
          (b.lastActivityAt ?? b.createdAt).localeCompare(
            a.lastActivityAt ?? a.createdAt
          )
        )[0] ?? null,
  }
}

export function useSession(sessionId: number) {
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => api.sessions.get(sessionId),
    refetchInterval: 20_000, // refleja lo que cuentan otros celulares
  })
}

function useSyncSession() {
  const queryClient = useQueryClient()
  return (session: CountSession) => {
    queryClient.setQueryData(queryKeys.session(session.id), session)
    return queryClient.invalidateQueries({ queryKey: ["stores"] })
  }
}

export function useCreateSession() {
  const sync = useSyncSession()
  return useMutation({ mutationFn: api.sessions.create, onSuccess: sync })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()
  const sync = useSyncSession()
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: number } & Parameters<typeof api.sessions.update>[1]) =>
      api.sessions.update(id, input),
    onSuccess: async (session) => {
      await sync(session)
      await queryClient.invalidateQueries({
        queryKey: ["sessions", session.id],
      })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.sessions.remove,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["sessions", id] })
      return queryClient.invalidateQueries({ queryKey: ["stores"] })
    },
  })
}
