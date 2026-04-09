import { API_BASE } from "@/lib/api-config"

export type PermissionDto = {
  id: number
  code: string
  description: string | null
}

export async function fetchAllPermissions(): Promise<PermissionDto[]> {
  const res = await fetch(`${API_BASE}/permissions`)
  const json = (await res.json()) as { message?: string; data?: PermissionDto[] }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los permisos.")
  }
  return json.data ?? []
}
