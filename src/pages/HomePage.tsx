import { FileSpreadsheetIcon, PlusIcon, ScanBarcodeIcon } from "lucide-react"
import { useState } from "react"

import { PageHeader } from "@/components/common/PageHeader"
import { QueryError } from "@/components/common/QueryError"
import { ImportSheet } from "@/components/data/ImportSheet"
import { NewSessionSheet } from "@/components/home/NewSessionSheet"
import { ClosedSessionRow, SessionCard } from "@/components/home/SessionCard"
import { StockCard } from "@/components/home/StockCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/useAuth"
import { useSessions } from "@/hooks/useSessions"
import { useSnapshots } from "@/hooks/useSnapshots"
import { useStore } from "@/hooks/useStore"

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}

export function HomePage() {
  const { store, isLoading: storesLoading, error } = useStore()
  const { latest, isLoading: snapshotsLoading } = useSnapshots(store?.id)
  const {
    openSessions,
    closedSessions,
    isLoading: sessionsLoading,
  } = useSessions(store?.id)
  const { user, can } = useAuth()
  const canImport = can("imports.upload")
  const canManage = can("sessions.manage")
  const [importOpen, setImportOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  if (error)
    return <QueryError error={error} onRetry={() => location.reload()} />

  if (!storesLoading && !store) {
    return (
      <>
        <Empty className="mt-6 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSpreadsheetIcon />
            </EmptyMedia>
            <EmptyTitle>
              {canImport
                ? "Empecemos con tus existencias"
                : "Aún no hay existencias"}
            </EmptyTitle>
            <EmptyDescription>
              {canImport
                ? "Sube el Excel de existencias del sistema (y, si lo tienes, el maestro de códigos de barras). Así sabremos qué debería haber en la tienda."
                : "El administrador de tu tienda debe cargar el reporte de existencias antes de empezar a contar."}
            </EmptyDescription>
          </EmptyHeader>
          {canImport && (
            <EmptyContent>
              <Button size="xl" onClick={() => setImportOpen(true)}>
                <FileSpreadsheetIcon /> Subir Excel
              </Button>
            </EmptyContent>
          )}
        </Empty>
        <ImportSheet open={importOpen} onOpenChange={setImportOpen} />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow={`${greeting()}, ${user?.fullName.split(" ")[0] ?? ""}`}
        title="Conteo de inventario"
        description="Cuenta lo que hay en tienda y compáralo con lo que dice el sistema."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {sessionsLoading ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : openSessions.length > 0 ? (
            openSessions.map((s) => <SessionCard key={s.id} session={s} />)
          ) : (
            <Card className="bg-primary/10 ring-primary/30">
              <CardContent className="flex flex-col items-start gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <ScanBarcodeIcon className="size-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">
                    {canManage
                      ? "¿Listo para contar?"
                      : "No hay un conteo abierto"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {canManage
                      ? "Inicia un conteo y tu equipo podrá unirse desde sus celulares. Cada lectura se guarda al instante en el servidor."
                      : "Cuando el administrador inicie un conteo aparecerá aquí para que te unas."}
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={() => setNewOpen(true)}
                  >
                    <PlusIcon /> Nuevo conteo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {canManage && openSessions.length > 0 && (
            <Button
              variant="outline"
              size="xl"
              onClick={() => setNewOpen(true)}
            >
              <PlusIcon /> Nuevo conteo
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <StockCard
            snapshot={latest}
            isLoading={snapshotsLoading}
            onImport={canImport ? () => setImportOpen(true) : undefined}
          />
          {closedSessions.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Conteos anteriores</CardTitle>
              </CardHeader>
              <CardContent className="-mx-1 flex flex-col px-2">
                {closedSessions.slice(0, 6).map((s) => (
                  <ClosedSessionRow key={s.id} session={s} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ImportSheet open={importOpen} onOpenChange={setImportOpen} />
      <NewSessionSheet open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}
