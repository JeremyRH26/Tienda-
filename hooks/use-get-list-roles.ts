"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchRoles } from "@/lib/services/roles.service"

export function useGetListRoles(enabled: boolean = true) {
  return useQuery({
    queryKey: ["roles", "list"],
    queryFn: fetchRoles,
    enabled,
  })
}
