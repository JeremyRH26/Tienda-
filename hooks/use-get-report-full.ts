"use client"

import { useQuery } from "@tanstack/react-query"
import {
  fetchReportFull,
  type ReportFullQueryParams,
} from "@/lib/services/reports.service"

export function useGetReportFull(params: ReportFullQueryParams | null) {
  return useQuery({
    queryKey: [
      "reports",
      "full",
      params?.grouping,
      params?.startDate,
      params?.endDate,
      params?.refDate,
    ],
    queryFn: async () => {
      if (!params) {
        throw new Error("Parámetros del reporte no disponibles.")
      }
      return fetchReportFull(params)
    },
    enabled: params != null,
    // El cliente global usa staleTime de 1 min; sin esto, al volver a /reportes
    // dentro de ese minuto no se vuelve a llamar al API aunque la pantalla se monte de nuevo.
    staleTime: 0,
    refetchOnMount: "always",
  })
}
