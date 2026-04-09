import type { ModulePermission } from "@/lib/mock-data"

/** Orden del menú: la primera sección permitida es la ruta por defecto tras login. */
export const MODULE_ORDER: ModulePermission[] = [
  "dashboard",
  "ventas",
  "inventario",
  "clientes",
  "proveedores",
  "gastos",
  "equipo",
  "reportes",
]

export function getDefaultModulePath(permissions: readonly string[]): string {
  for (const id of MODULE_ORDER) {
    if (permissions.includes(id)) return `/${id}`
  }
  return "/dashboard"
}

export function getRoleHomePath(role: "admin" | "cajero"): string {
  return role === "admin" ? "/dashboard" : "/ventas"
}

