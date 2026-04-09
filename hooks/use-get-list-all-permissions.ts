"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchAllPermissions } from "@/lib/services/permissions.service"

export function useGetListAllPermissions(enabled = true) {
  return useQuery({
    queryKey: ["permissions", "all"],
    queryFn: fetchAllPermissions,
    enabled,
  })
}
