import { CloudOffIcon, RotateCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function QueryError({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOffIcon />
        </EmptyMedia>
        <EmptyTitle>No pudimos cargar la información</EmptyTitle>
        <EmptyDescription>{error.message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="lg" onClick={onRetry}>
            <RotateCwIcon /> Reintentar
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
