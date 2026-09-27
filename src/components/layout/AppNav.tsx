import { Link, useMatchRoute } from "@tanstack/react-router"
import { toast } from "sonner"

import { NAV_ITEMS, type NavKey } from "@/components/layout/nav-items"
import { useSessions } from "@/hooks/useSessions"
import { useStore } from "@/hooks/useStore"
import { cn } from "@/lib/utils"

function useNavTargets() {
  const { store } = useStore()
  const { activeSession } = useSessions(store?.id)
  const matchRoute = useMatchRoute()
  const sessionMatch = matchRoute({ to: "/conteos/$sessionId", fuzzy: true })
  // Si ya estás dentro de un conteo, Contar/Diferencias se quedan en ese conteo.
  const sessionId = sessionMatch ? sessionMatch.sessionId : activeSession?.id
  const onCompare = !!matchRoute({ to: "/conteos/$sessionId/diferencias" })

  // null: páginas fuera de la navegación principal (p. ej. Usuarios).
  const active: NavKey | null = matchRoute({ to: "/datos" })
    ? "data"
    : onCompare
      ? "compare"
      : sessionMatch
        ? "count"
        : matchRoute({ to: "/" })
          ? "home"
          : null
  return { sessionId: sessionId ? String(sessionId) : null, active }
}

function NavLink({
  item,
  sessionId,
  active,
  variant,
}: {
  item: (typeof NAV_ITEMS)[number]
  sessionId: string | null
  active: boolean
  variant: "bar" | "rail"
}) {
  const Icon = item.icon
  const className = cn(
    "group flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
    variant === "bar" ? "h-14 flex-1" : "h-16 w-18",
    active && "text-foreground"
  )
  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary text-primary-foreground" : "group-hover:bg-muted"
        )}
      >
        <Icon className="size-5" />
      </span>
      {item.label}
    </>
  )
  const needsSession = item.key === "count" || item.key === "compare"
  if (needsSession && !sessionId) {
    return (
      <Link
        to="/"
        className={className}
        onClick={() => toast.info("Primero inicia un conteo desde Inicio.")}
      >
        {content}
      </Link>
    )
  }
  const aria = { "aria-current": active ? ("page" as const) : undefined }
  switch (item.key) {
    case "home":
      return (
        <Link to="/" className={className} {...aria}>
          {content}
        </Link>
      )
    case "data":
      return (
        <Link to="/datos" className={className} {...aria}>
          {content}
        </Link>
      )
    case "count":
      return (
        <Link
          to="/conteos/$sessionId"
          params={{ sessionId: sessionId! }}
          className={className}
          {...aria}
        >
          {content}
        </Link>
      )
    case "compare":
      return (
        <Link
          to="/conteos/$sessionId/diferencias"
          params={{ sessionId: sessionId! }}
          className={className}
          {...aria}
        >
          {content}
        </Link>
      )
  }
}

export function BottomNav() {
  const { sessionId, active } = useNavTargets()
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-safe backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-lg px-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            sessionId={sessionId}
            active={active === item.key}
            variant="bar"
          />
        ))}
      </div>
    </nav>
  )
}

export function SideRail() {
  const { sessionId, active } = useNavTargets()
  return (
    <nav
      aria-label="Navegación principal"
      className="sticky top-16 hidden h-[calc(100svh-4rem)] w-24 shrink-0 flex-col items-center gap-2 border-r py-4 md:flex"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          item={item}
          sessionId={sessionId}
          active={active === item.key}
          variant="rail"
        />
      ))}
    </nav>
  )
}
