import { Link, useRouter } from "@tanstack/react-router"
import { ArrowLeftIcon, HouseIcon, SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Ruta inexistente: explica qué pasó y ofrece volver, sin salir de la app. */
export function NotFoundPage() {
  const router = useRouter()
  const canGoBack = typeof window !== "undefined" && window.history.length > 1

  return (
    <div className="mx-auto flex min-h-[60svh] max-w-lg items-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-14 rounded-2xl [&_svg]:size-7"
          >
            <SearchXIcon />
          </EmptyMedia>
          <p className="tabular font-heading text-5xl font-bold tracking-tight text-muted-foreground/40">
            404
          </p>
          <EmptyTitle className="text-xl">Esta página no existe</EmptyTitle>
          <EmptyDescription>
            Puede que el enlace esté incompleto o que el conteo haya sido
            eliminado. Tu información está a salvo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="xl" className="w-full sm:w-auto">
            <Link to="/">
              <HouseIcon /> Ir al inicio
            </Link>
          </Button>
          {canGoBack && (
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto"
              onClick={() => router.history.back()}
            >
              <ArrowLeftIcon /> Volver
            </Button>
          )}
        </EmptyContent>
      </Empty>
    </div>
  )
}
