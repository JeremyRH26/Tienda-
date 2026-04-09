import type { Employee } from "@/lib/mock-data"

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

export async function login(username: string, password: string): Promise<Employee> {
  const res = await fetch(
    `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api")}/auth/login`,
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
    .filter((m): m is string => m != null)

  const roleName = String(d.role?.name ?? "")
  return {
    id: d.employee.id,
    name: d.employee.fullName,
    role: roleName === "Administrador" ? "admin" : "cajero",
    roleLabel: roleName,
    username: d.employee.username,
    password: "",
    phone: d.employee.phone ?? "",
    status: d.employee.status === 1 ? "active" : "inactive",
    shift: "",
    permissions,
  } as Employee
}
