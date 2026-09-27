import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
} from "@tanstack/react-router"
import { lazy } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import type { LineStatus } from "@/lib/api/types"
import type { StatusFilter } from "@/pages/ComparisonPage"
import { HomePage } from "@/pages/HomePage"

// Carga diferida: el lector de códigos (WASM) solo se descarga al entrar a contar.
const CountPage = lazy(() =>
  import("@/pages/CountPage").then((m) => ({ default: m.CountPage }))
)
const ComparisonPage = lazy(() =>
  import("@/pages/ComparisonPage").then((m) => ({ default: m.ComparisonPage }))
)
const UsersPage = lazy(() =>
  import("@/pages/UsersPage").then((m) => ({ default: m.UsersPage }))
)
const DataPage = lazy(() =>
  import("@/pages/DataPage").then((m) => ({ default: m.DataPage }))
)

const STATUS_FILTERS: StatusFilter[] = [
  "missing",
  "surplus",
  "unexpected",
  "ok",
  "all",
]

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Button asChild size="xl">
        <Link to="/">Ir al inicio</Link>
      </Button>
    </div>
  ),
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
})

const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/datos",
  component: DataPage,
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/usuarios",
  component: UsersPage,
})

const parseSessionId = ({ sessionId }: { sessionId: string }) => ({ sessionId })

const countRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conteos/$sessionId",
  params: { parse: parseSessionId },
  component: function CountRouteComponent() {
    const { sessionId } = countRoute.useParams()
    // key: al cambiar de conteo se reinicia todo el estado local de la pantalla
    return <CountPage key={sessionId} sessionId={Number(sessionId)} />
  },
})

const comparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conteos/$sessionId/diferencias",
  validateSearch: (
    search: Record<string, unknown>
  ): { estado?: StatusFilter } =>
    STATUS_FILTERS.includes(search.estado as LineStatus)
      ? { estado: search.estado as StatusFilter }
      : {},
  component: function ComparisonRouteComponent() {
    const { sessionId } = comparisonRoute.useParams()
    const { estado } = comparisonRoute.useSearch()
    // Por defecto, lo más accionable: los faltantes.
    return (
      <ComparisonPage
        sessionId={Number(sessionId)}
        status={estado ?? "missing"}
      />
    )
  },
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  dataRoute,
  usersRoute,
  countRoute,
  comparisonRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
