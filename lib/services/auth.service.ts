import type { AuthUser, ModulePermission } from "@/lib/mock-data"

const mod: Record<string, string> = {
  "MOD-001": "dashboard",
  "MOD-002": "ventas",
  "MOD-003": "inventario",
  "MOD-004": "clientes",
  "MOD-005": "proveedores",
  "MOD-006": "gastos",
  "MOD-007": "equipo",
  "MOD-008": "reportes",
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(
    `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")}/api/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    }
  )
  const json = (await res.json()) as { message?: string; data?: any }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo iniciar sesión.")
  }
  const d = json.data
  if (!d?.employee) throw new Error("Respuesta inválida del servidor.")

  const list = (d.permissions ?? []) as string[]
  const permissions = list
    .map((code) => mod[code])
    .filter((m): m is ModulePermission => m != null)

  const roleName = String(d.role?.name ?? "")
  const roleId = Number(d.role?.id)
  const st = d.employee.status === 1 ? 1 : 0

  return {
    id: d.employee.id,
    roleId: Number.isFinite(roleId) ? roleId : 0,
    fullName: d.employee.fullName,
    username: d.employee.username,
    phone: d.employee.phone ?? null,
    status: st,
    roleLabel: roleName,
    permissions,
    role: roleName === "Administrador" ? "admin" : "cajero",
  }
}
