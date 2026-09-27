import { createContext } from "react"

import type { User } from "@/lib/api/types"
import type { Permission } from "@/lib/permissions"

export type AuthStatus = "loading" | "anonymous" | "authenticated"

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  isAdmin: boolean
  can: (permission: Permission) => boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)
