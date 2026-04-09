"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth-context"
import { getRoleHomePath } from "@/lib/app-routes"
import type { ModulePermission } from "@/lib/mock-data"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function MainShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const permissions = user?.permissions ?? []
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard"

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.permissions.length === 0) return
    if (!user.permissions.includes(segment as ModulePermission)) {
      const target = getRoleHomePath(user.role)
      if (target !== pathname) {
        router.replace(target)
      }
    }
  }, [ready, user, pathname, segment, router])

  const userRoleLabel =
    user?.roleLabel ??
    (user?.role === "admin" ? "Administrador" : "Cajero")
  const userInitials = useMemo(
    () => (user ? initialsFromName(user.name) : ""),
    [user]
  )

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    )
  }

  if (user.permissions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border p-5 text-center">
          <p className="font-medium">Usuario sin permisos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contacte al administrador para asignar módulos.
          </p>
          <Button className="mt-4" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar
          pathname={pathname}
          onNavigate={() => {}}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          permissions={permissions}
          userDisplayName={user.name}
          userRoleLabel={userRoleLabel}
          userInitials={userInitials}
          onLogout={handleLogout}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-2 pl-1 md:hidden">
          <div className="flex items-center gap-1">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <span className="text-lg font-semibold">MiniMer</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            title="Cerrar sesión"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Navega entre las diferentes secciones del sistema.
          </SheetDescription>
          <AppSidebar
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            collapsed={false}
            onToggleCollapse={() => {}}
            permissions={permissions}
            userDisplayName={user.name}
            userRoleLabel={userRoleLabel}
            userInitials={userInitials}
            onLogout={() => {
              handleLogout()
              setMobileOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
