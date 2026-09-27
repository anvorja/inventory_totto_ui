import type { ReactNode } from "react"

import { BrandMark } from "@/components/layout/BrandMark"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

/** Marco de las pantallas sin sesión: una columna en móvil, tarjeta centrada en tablet. */
export function AuthLayout({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background pt-safe pb-safe md:items-center md:justify-center md:bg-muted/40">
      <div className="flex justify-end p-3 md:absolute md:top-3 md:right-3">
        <ThemeToggle />
      </div>
      <main className="flex w-full flex-1 flex-col px-6 pb-10 md:max-w-md md:flex-none md:rounded-[2rem] md:bg-card md:p-10 md:shadow-xl md:ring-1 md:ring-foreground/5">
        <div className="mb-8 flex flex-col gap-4 md:items-center md:text-center">
          <div className="origin-left scale-125 md:origin-center md:scale-150">
            <BrandMark />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
