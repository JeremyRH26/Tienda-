import { notFound } from "next/navigation"
import { isDevGastosStandalone } from "@/lib/dev-config"

export default function DevGastosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isDevGastosStandalone) {
    notFound()
  }

  const apiHint =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080 (por defecto)"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-3 text-center">
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Modo prueba: solo módulo Gastos (sin sesión)
        </p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/90">
          API: {apiHint}
        </p>
      </header>
      {children}
    </div>
  )
}
