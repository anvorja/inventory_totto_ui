import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { installPreloadErrorHandler } from "@/lib/chunk-reload"
import { AppProviders } from "@/providers/AppProviders"
import { router } from "@/router"

installPreloadErrorHandler()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
