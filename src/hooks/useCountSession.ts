import { useContext } from "react"

import { CountSessionContext } from "@/contexts/CountSessionContext"

export function useCountSession() {
  const context = useContext(CountSessionContext)
  if (!context)
    throw new Error(
      "useCountSession debe usarse dentro de <CountSessionProvider>"
    )
  return context
}
