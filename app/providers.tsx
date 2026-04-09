"use client"

import { useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { BusinessProvider } from "@/lib/business-context"
import { AuthProvider } from "@/lib/auth-context"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BusinessProvider>
        <AuthProvider>{children}</AuthProvider>
      </BusinessProvider>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
