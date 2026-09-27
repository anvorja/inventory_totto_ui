import type { ErrorComponentProps } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { HouseIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { isChunkLoadError } from "@/lib/chunk-reload"

/** Error inesperado al mostrar una pantalla. Reemplaza el mensaje genérico del router. */
export function ErrorPage({ error }: ErrorComponentProps) {
  const newVersion = isChunkLoadError(error)
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-lg items-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-14 rounded-2xl [&_svg]:size-7"
          >
            {newVersion ? <RefreshCwIcon /> : <TriangleAlertIcon />}
          </EmptyMedia>
          <EmptyTitle className="text-xl">
            {newVersion ? "Hay una versión nueva de la app" : "Algo salió mal"}
          </EmptyTitle>
          <EmptyDescription>
            {newVersion
              ? "Se publicó una actualización mientras la tenías abierta. Recarga para continuar; tus lecturas ya están guardadas."
              : "No pudimos mostrar esta pantalla. Recarga para intentarlo de nuevo; tus lecturas ya están guardadas en el servidor."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            size="xl"
            className="w-full sm:w-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCwIcon /> Recargar
          </Button>
          <Button
            asChild
            variant="outline"
            size="xl"
            className="w-full sm:w-auto"
          >
            <Link to="/" reloadDocument>
              <HouseIcon /> Ir al inicio
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
