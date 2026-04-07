"use client"

import { useEffect, useMemo, useState } from "react"
import { BusinessProvider } from "@/lib/business-context"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { LoginScreen } from "@/components/auth/login-screen"
import { Dashboard } from "@/components/sections/dashboard"
import { Ventas } from "@/components/sections/ventas"
import { Inventario } from "@/components/sections/inventario"
import { Clientes } from "@/components/sections/clientes"
import { Proveedores } from "@/components/sections/proveedores"
import { Equipo } from "@/components/sections/equipo"
import { Reportes } from "@/components/sections/reportes"
import { Gastos } from "@/components/sections/gastos"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { ModulePermission } from "@/lib/mock-data"

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function AuthenticatedShell() {
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const permissions = user?.permissions ?? []

  useEffect(() => {
    if (!user) return
    const allowed = user.permissions
    if (!allowed.includes(activeSection as ModulePermission)) {
      setActiveSection(
        allowed.includes("dashboard") ? "dashboard" : allowed[0] ?? "dashboard"
      )
    }
  }, [user, activeSection])

  const canAccess = (section: string) =>
    permissions.includes(section as ModulePermission)

  const renderSection = () => {
    if (!canAccess(activeSection)) {
      return (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No tiene permiso para ver esta sección.
        </div>
      )
    }
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />
      case "ventas":
        return <Ventas />
      case "inventario":
        return <Inventario />
      case "clientes":
        return <Clientes />
      case "proveedores":
        return <Proveedores />
      case "gastos":
        return <Gastos />
      case "equipo":
        return <Equipo />
      case "reportes":
        return <Reportes />
      default:
        return <Dashboard />
    }
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setMobileOpen(false)
  }

  const userRoleLabel = user?.role === "admin" ? "Administrador" : "Cajero"
  const userInitials = useMemo(
    () => (user ? initialsFromName(user.name) : ""),
    [user]
  )

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          permissions={permissions}
          userDisplayName={user.name}
          userRoleLabel={userRoleLabel}
          userInitials={userInitials}
          onLogout={logout}
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
            onClick={logout}
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
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            collapsed={false}
            onToggleCollapse={() => {}}
            permissions={permissions}
            userDisplayName={user.name}
            userRoleLabel={userRoleLabel}
            userInitials={userInitials}
            onLogout={() => {
              logout()
              setMobileOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{renderSection()}</div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <BusinessProvider>
      <AuthProvider>
        <AuthenticatedShell />
      </AuthProvider>
    </BusinessProvider>
  )
}
