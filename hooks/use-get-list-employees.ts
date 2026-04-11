"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchEmployees,
  type EmployeeListDto,
} from "@/lib/services/employees.service"
import {
  allModules,
  isAdminRoleLabel,
  MOCK_PASSWORD_HASH_PLACEHOLDER,
  type EmployeeWithPermissions,
  type ModulePermission,
} from "@/lib/mock-data"

function defaultPermissions(roleLabel: string): ModulePermission[] {
  if (isAdminRoleLabel(roleLabel)) return allModules.map((m) => m.id)
  return ["dashboard", "ventas", "clientes"]
}

function toEmployeeWithPermissions(
  e: EmployeeListDto,
): EmployeeWithPermissions {
  return {
    id: e.id,
    roleId: e.roleId,
    fullName: e.fullName,
    username: e.username,
    passwordHash: MOCK_PASSWORD_HASH_PLACEHOLDER,
    phone: e.phone,
    status: e.status,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    roleLabel: e.roleName,
    permissions: defaultPermissions(e.roleName),
  }
}

export function useGetListEmployees() {
  return useQuery({
    queryKey: ["employees", "list"],
    queryFn: async () => {
      const list = await fetchEmployees()
      return list.map(toEmployeeWithPermissions)
    },
  })
}
