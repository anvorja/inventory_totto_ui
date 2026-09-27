import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, type ReactNode } from "react"
import { toast } from "sonner"

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext"
import { isApiError, onAuthEvent } from "@/lib/api/client"
import { api } from "@/lib/api/endpoints"
import { queryKeys } from "@/lib/api/query-keys"
import type { User } from "@/lib/api/types"
import { can as canDo } from "@/lib/permissions"

/** Borra los datos cacheados del usuario anterior, conservando la consulta de sesión. */
function clearUserData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.cancelQueries({ predicate: (q) => q.queryKey[0] !== "auth" })
  queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" })
  queryClient.getMutationCache().clear()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await api.auth.me()
      } catch (error) {
        if (isApiError(error) && error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
  const user = me.data ?? null

  const setUser = useCallback(
    (next: User | null) => {
      if (next === null) clearUserData(queryClient)
      queryClient.setQueryData(queryKeys.me, next)
    },
    [queryClient]
  )

  useEffect(
    () =>
      onAuthEvent((event) => {
        if (
          event === "unauthorized" &&
          queryClient.getQueryData(queryKeys.me)
        ) {
          toast.info("Tu sesión expiró. Vuelve a ingresar.")
          setUser(null)
        }
        if (event === "password_change_required") {
          queryClient.invalidateQueries({ queryKey: queryKeys.me })
        }
      }),
    [queryClient, setUser]
  )

  const login = useCallback(
    async (username: string, password: string) => {
      const logged = await api.auth.login(username, password)
      clearUserData(queryClient)
      queryClient.setQueryData(queryKeys.me, logged)
      return logged
    },
    [queryClient]
  )

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => undefined)
    setUser(null)
  }, [setUser])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const updated = await api.auth.changePassword(
        currentPassword,
        newPassword
      )
      queryClient.setQueryData(queryKeys.me, updated)
    },
    [queryClient]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status: me.isPending ? "loading" : user ? "authenticated" : "anonymous",
      user,
      isAdmin: user?.role === "administrador",
      can: (permission) => canDo(user, permission),
      login,
      logout,
      changePassword,
    }),
    [me.isPending, user, login, logout, changePassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
