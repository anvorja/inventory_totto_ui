import { Link, Outlet } from "@tanstack/react-router"
import { Suspense } from "react"

import { BottomNav, SideRail } from "@/components/layout/AppNav"
import { BrandMark } from "@/components/layout/BrandMark"
import { StoreSwitcher } from "@/components/layout/StoreSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { UserMenu } from "@/components/layout/UserMenu"
import { Spinner } from "@/components/ui/spinner"

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 pt-safe backdrop-blur-lg">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Link
            to="/"
            aria-label="Inicio"
            className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <BrandMark />
          </Link>
          <div className="min-w-0 flex-1">
            <StoreSwitcher />
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <div className="flex">
        <SideRail />
        <main className="min-w-0 flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-10">
          <Suspense
            fallback={
              <div className="flex justify-center py-20 text-muted-foreground">
                <Spinner className="size-6" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
