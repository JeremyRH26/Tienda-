"use client"

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  UserCog,
  BarChart3,
  ChevronLeft,
  Store,
  Wallet,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ModulePermission } from "@/lib/mock-data"

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  permissions: ModulePermission[]
  userDisplayName: string
  userRoleLabel: string
  userInitials: string
  onLogout: () => void
}

const navItems: {
  id: ModulePermission
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "ventas", label: "Ventas/POS", icon: ShoppingCart },
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "proveedores", label: "Proveedores", icon: Truck },
  { id: "gastos", label: "Gastos", icon: Wallet },
  { id: "equipo", label: "Equipo", icon: UserCog },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
]

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onToggleCollapse,
  permissions,
  userDisplayName,
  userRoleLabel,
  userInitials,
  onLogout,
}: AppSidebarProps) {
  const visible = navItems.filter((item) => permissions.includes(item.id))

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              GestiónPro
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visible.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-medium">{userInitials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                {userDisplayName}
              </span>
              <span className="text-xs text-muted-foreground">{userRoleLabel}</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full gap-2 border-sidebar-border text-sidebar-foreground"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      )}

      {collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-sidebar-foreground"
            title="Cerrar sesión"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
    </aside>
  )
}
