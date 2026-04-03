"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Dashboard } from "@/components/sections/dashboard"
import { Ventas } from "@/components/sections/ventas"
import { Inventario } from "@/components/sections/inventario"
import { Clientes } from "@/components/sections/clientes"
import { Proveedores } from "@/components/sections/proveedores"
import { Equipo } from "@/components/sections/equipo"
import { Reportes } from "@/components/sections/reportes"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderSection = () => {
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

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Header & Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <span className="ml-3 text-lg font-semibold">GestiónPro</span>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">Navega entre las diferentes secciones del sistema.</SheetDescription>
          <AppSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            collapsed={false}
            onToggleCollapse={() => {}}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{renderSection()}</div>
      </main>
    </div>
  )
}
