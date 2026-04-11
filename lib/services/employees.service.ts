import { API_BASE } from "@/lib/api-config"

/** Fila de listado (sin password_hash). */
export type EmployeeListDto = {
  id: number
  roleId: number
  fullName: string
  username: string
  phone: string | null
  status: 0 | 1
  createdAt: string
  updatedAt: string
  roleName: string
}

export async function fetchEmployees(): Promise<EmployeeListDto[]> {
  const res = await fetch(`${API_BASE}/employees`)
  const json = (await res.json()) as {
    message?: string
    data?: EmployeeListDto[]
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los empleados.")
  }
  return json.data ?? []
}

export type CreateEmployeePayload = {
  fullName: string
  username: string
  password: string
  phone: string | null
  roleId: number
}

export type CreateEmployeeResult = {
  id: number
  fullName: string
  username: string
  phone: string | null
  status: 1
  role: {
    id: number
    name: string
  }
}

export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<CreateEmployeeResult> {
  const res = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: payload.fullName,
      username: payload.username,
      password: payload.password,
      phone: payload.phone ?? "",
      roleId: payload.roleId,
    }),
  })
  const json = (await res.json()) as {
    message?: string
    data?: CreateEmployeeResult
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo crear el empleado.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export type UpdateEmployeePayload = {
  fullName: string
  username: string
  /** Si se omite o está vacía, no se cambia la contraseña en el servidor. */
  password?: string
  phone: string | null
  roleId: number
  status: 0 | 1
}

export type UpdateEmployeeResult = {
  id: number
  fullName: string
  username: string
  phone: string | null
  status: 0 | 1
  role: {
    id: number
    name: string
  }
}

export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<UpdateEmployeeResult> {
  const body: Record<string, unknown> = {
    fullName: payload.fullName,
    username: payload.username,
    phone: payload.phone ?? "",
    roleId: payload.roleId,
    status: payload.status,
  }
  if (payload.password != null && payload.password !== "") {
    body.password = payload.password
  }
  const res = await fetch(`${API_BASE}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as {
    message?: string
    data?: UpdateEmployeeResult
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo actualizar el empleado.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export type RemoveEmployeeOutcome = "deleted" | "deactivated"

export async function deleteEmployee(
  id: number,
): Promise<{ outcome: RemoveEmployeeOutcome }> {
  const res = await fetch(`${API_BASE}/employees/${id}`, {
    method: "DELETE",
  })
  const json = (await res.json()) as {
    message?: string
    data?: { outcome?: RemoveEmployeeOutcome }
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo dar de baja al colaborador.")
  }
  const outcome = json.data?.outcome
  if (outcome !== "deleted" && outcome !== "deactivated") {
    throw new Error("Respuesta inválida del servidor.")
  }
  return { outcome }
}
