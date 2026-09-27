import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { AuthGate } from "@/components/auth/AuthGate"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/query-client"
import { AuthProvider } from "@/providers/AuthProvider"
import { StoreProvider } from "@/providers/StoreProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate>
            {/* La tienda y el resto de datos solo se piden con sesión iniciada. */}
            <StoreProvider>{children}</StoreProvider>
          </AuthGate>
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
