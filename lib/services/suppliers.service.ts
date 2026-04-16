import { API_BASE } from "@/lib/api-config"

export type SupplierDto = {
  id: number
  companyName: string
  contactName: string
  phone: string
  email: string
}

export type CreateSupplierPayload = {
  companyName: string
  contactName?: string
  phone?: string
  email?: string
}

export type CreateSupplierResult = {
  id: number
}

async function readJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  try {
    return (await res.json()) as { message?: string; data?: unknown }
  } catch {
    return {}
  }
}

function mapRow(row: Record<string, unknown>): SupplierDto {
  return {
    id: Number(row.id),
    companyName: String(row.companyName ?? row.company_name ?? ""),
    contactName: String(row.contactName ?? row.contact_name ?? ""),
    phone: row.phone != null ? String(row.phone) : "",
    email: row.email != null ? String(row.email) : "",
  }
}

export async function fetchSuppliers(): Promise<SupplierDto[]> {
  const res = await fetch(`${API_BASE}/suppliers`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudieron cargar los proveedores.",
    )
  }
  const data = json.data
  if (!Array.isArray(data)) {
    return []
  }
  return data
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((x) => Number.isFinite(x.id) && x.id > 0)
}

export async function fetchSupplierById(id: number): Promise<SupplierDto> {
  const res = await fetch(`${API_BASE}/suppliers/${id}`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo cargar el proveedor.",
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  if (!d || d.id == null) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return mapRow(d)
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<CreateSupplierResult> {
  const res = await fetch(`${API_BASE}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: payload.companyName.trim(),
      contactName: payload.contactName?.trim() ?? "",
      phone: payload.phone?.trim() ?? "",
      email: payload.email?.trim() ?? "",
    }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(typeof json.message === "string" ? json.message : "No se pudo registrar el proveedor.")
  }
  const d = json.data as Record<string, unknown> | undefined
  const rawId = d?.id ?? d?.ID
  const id = Number(rawId)
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return { id }
}

export async function updateSupplier(
  id: number,
  payload: CreateSupplierPayload,
): Promise<SupplierDto> {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: payload.companyName.trim(),
      contactName: payload.contactName?.trim() ?? "",
      phone: payload.phone?.trim() ?? "",
      email: payload.email?.trim() ?? "",
    }),
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo actualizar el proveedor.",
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  if (!d || d.id == null) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return mapRow(d)
}

export async function deleteSupplier(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: "DELETE",
  })
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(typeof json.message === "string" ? json.message : "No se pudo eliminar el proveedor.")
  }
}
