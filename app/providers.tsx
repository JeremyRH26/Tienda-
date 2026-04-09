"use client"

import type { ReactNode } from "react"
import { BusinessProvider } from "@/lib/business-context"
import { AuthProvider } from "@/lib/auth-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BusinessProvider>
      <AuthProvider>{children}</AuthProvider>
    </BusinessProvider>
  )
}
