import type { PermissionDto } from "@/lib/services/permissions.service"
import { API_BASE } from "@/lib/api-config"

export type RoleDto = {
  id: number
  name: string
}

export async function fetchRoles(): Promise<RoleDto[]> {
  const res = await fetch(`${API_BASE}/roles`)
  const json = (await res.json()) as { message?: string; data?: RoleDto[] }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los roles.")
  }
  return json.data ?? []
}

export async function createRole(name: string): Promise<RoleDto> {
  const res = await fetch(`${API_BASE}/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  const json = (await res.json()) as { message?: string; data?: RoleDto }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo crear el rol.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function assignPermissionsToRole(
  roleId: number,
  permissionIds: number[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissionIds }),
  })
  const json = (await res.json()) as { message?: string }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron asignar los permisos.")
  }
}

export async function fetchRolePermissions(
  roleId: number
): Promise<PermissionDto[]> {
  const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`)
  const json = (await res.json()) as { message?: string; data?: PermissionDto[] }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los permisos del rol.")
  }
  return json.data ?? []
}

export async function deleteRole(roleId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/roles/${roleId}`, {
    method: "DELETE",
  })
  const json = (await res.json()) as { message?: string }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo eliminar el rol.")
  }
}

export async function updateRole(roleId: number, name: string): Promise<RoleDto> {
  const res = await fetch(`${API_BASE}/roles/${roleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  const json = (await res.json()) as { message?: string; data?: RoleDto }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo actualizar el rol.")
  }
  if (!json.data) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

/**
 * Actualiza nombre del rol y luego reemplaza permisos (mismo contrato que creación).
 */
export async function updateRoleWithPermissions(
  roleId: number,
  name: string,
  permissionIds: number[]
): Promise<void> {
  await updateRole(roleId, name)
  await assignPermissionsToRole(roleId, permissionIds)
}

/**
 * Crea el rol y luego asigna permisos en dos pasos (asíncronos en secuencia).
 */
export async function createRoleWithPermissions(
  name: string,
  permissionIds: number[]
): Promise<RoleDto> {
  const created = await createRole(name)
  await assignPermissionsToRole(created.id, permissionIds)
  return created
}
