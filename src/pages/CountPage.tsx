import { Link } from "@tanstack/react-router"
import {
  GitCompareArrowsIcon,
  LockIcon,
  ShoppingBagIcon,
  UserRoundIcon,
} from "lucide-react"
import { useState } from "react"

import { QueryError } from "@/components/common/QueryError"
import { FeedbackCard } from "@/components/count/FeedbackCard"
import { ManualEntry } from "@/components/count/ManualEntry"
import { RecentScans } from "@/components/count/RecentScans"
import { RegisterProductSheet } from "@/components/count/RegisterProductSheet"
import { RegisterSaleSheet } from "@/components/count/RegisterSaleSheet"
import { ScannerPanel } from "@/components/count/ScannerPanel"
import { SessionMenu } from "@/components/count/SessionMenu"
import { ZonePicker } from "@/components/count/ZonePicker"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useCountSession } from "@/hooks/useCountSession"
import { useUpdateSession } from "@/hooks/useSessions"
import { formatNumber, plural } from "@/lib/format"
import { CountSessionProvider } from "@/providers/CountSessionProvider"

export function CountPage({ sessionId }: { sessionId: number }) {
  return (
    <CountSessionProvider sessionId={sessionId}>
      <CountScreen />
    </CountSessionProvider>
  )
}

function CountScreen() {
  const { session, isLoading, isOpen, sessionId } = useCountSession()
  const reopen = useUpdateSession()
  const { user, can } = useAuth()
  const [selling, setSelling] = useState(false)
  const canManage = can("sessions.manage")

  if (isLoading)
    return <Skeleton className="mx-auto h-[70svh] max-w-5xl rounded-3xl" />
  if (!session)
    return (
      <QueryError error={new Error("Este conteo no existe o fue eliminado.")} />
    )

  const expected = session.baseline?.totalUnits ?? 0
  const params = { sessionId: String(sessionId) }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
              {session.name}
            </h1>
            <p className="tabular text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {formatNumber(session.countedUnits)}
              </span>
              {expected > 0 && ` de ${formatNumber(expected)}`} unidades ·{" "}
              {formatNumber(session.countedProducts)} referencias
              {session.soldUnits > 0 &&
                ` · ${plural(session.soldUnits, "vendida")}`}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="hidden sm:inline-flex"
          >
            <Link to="/conteos/$sessionId/diferencias" params={params}>
              <GitCompareArrowsIcon /> Diferencias
            </Link>
          </Button>
          {canManage && <SessionMenu session={session} />}
        </div>
        {expected > 0 && (
          <Progress
            value={Math.min((session.countedUnits / expected) * 100, 100)}
            aria-label="Avance del conteo"
            className="h-1.5"
          />
        )}
      </div>

      {!isOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-3 text-sm">
          <LockIcon className="size-4 text-muted-foreground" />
          <span className="flex-1">
            {canManage
              ? "Este conteo está cerrado. Reábrelo para seguir sumando."
              : "Este conteo está cerrado. Solo un administrador puede reabrirlo."}
          </span>
          {canManage && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => reopen.mutate({ id: session.id, status: "open" })}
            >
              Reabrir
            </Button>
          )}
        </div>
      )}

      {/* Móvil: cámara → resultado → teclado → historial (el resultado siempre a la vista).
          Tablet: lectura a la izquierda, resultado e historial a la derecha. */}
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
        <section
          aria-label="Lectura"
          className="contents md:sticky md:top-20 md:flex md:flex-col md:gap-3"
        >
          <div className="order-1">
            <ScannerPanel />
          </div>
          <div className="order-3 flex flex-col gap-3">
            <ManualEntry />
            <Button
              variant="outline"
              size="xl"
              className="w-full"
              disabled={!isOpen}
              onClick={() => setSelling(true)}
            >
              <ShoppingBagIcon /> Registrar venta
            </Button>
          </div>
          <div className="order-4 flex flex-col gap-3">
            <ZonePicker />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRoundIcon className="size-3.5" />
              Tus lecturas quedan registradas a nombre de{" "}
              <span className="font-medium text-foreground">
                {user?.fullName}
              </span>
            </p>
          </div>
        </section>
        <section
          aria-label="Resultado"
          className="contents md:flex md:flex-col md:gap-4"
        >
          <div className="order-2">
            <FeedbackCard />
          </div>
          <div className="order-5">
            <RecentScans />
          </div>
        </section>
      </div>

      <RegisterProductSheet />
      <RegisterSaleSheet open={selling} onOpenChange={setSelling} />
    </div>
  )
}
