import { API_BASE } from "@/lib/api-config"
import type { ReportPeriodUi } from "@/lib/report-metrics"

export type ReportIndicatorsDto = {
  totalCobrado: number
  totalCosto: number
  totalMargen: number
  totalGastos: number
  totalAbonos: number
  totalFiado: number
  countVentas: number
  countFiado: number
  resultadoOperativo: number
}

export type ReportTrendRowDto = {
  label: string
  sales: number
}

export type ReportVentasVsGastosRowDto = {
  label: string
  sales: number
  expenses: number
}

export type ReportDesgloseRowDto = {
  label: string
  ventasCobradas: number
  gastos: number
  ganancia: number
  margenPct: number | null
}

export type ReportGastoTipoRowDto = {
  label: string
  amount: number
}

export type ReportMargenSerieRowDto = {
  label: string
  margin: number
}

export type ReportFiadoAbonosRowDto = {
  label: string
  abonos: number
  fiado: number
}

export type ReportFullDto = {
  grouping: ReportPeriodUi
  startDate: string
  endDate: string
  refDate: string | null
  indicators: ReportIndicatorsDto | null
  tendencia: ReportTrendRowDto[]
  ventasVsGastos: ReportVentasVsGastosRowDto[]
  desglose: ReportDesgloseRowDto[]
  gastosPorTipo: ReportGastoTipoRowDto[]
  margenSerie: ReportMargenSerieRowDto[]
  fiadoAbonosSerie: ReportFiadoAbonosRowDto[]
}

export type ReportFullQueryParams = {
  grouping: ReportPeriodUi
  startDate: string
  endDate: string
  refDate: string
}

async function readJson(
  res: Response
): Promise<{ message?: string; data?: unknown }> {
  try {
    return (await res.json()) as { message?: string; data?: unknown }
  } catch {
    return {}
  }
}

export async function fetchReportFull(
  params: ReportFullQueryParams
): Promise<ReportFullDto> {
  const qs = new URLSearchParams({
    grouping: params.grouping,
    startDate: params.startDate,
    endDate: params.endDate,
    refDate: params.refDate,
  })
  const res = await fetch(`${API_BASE}/reports/full?${qs.toString()}`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo cargar el reporte."
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  if (!d || typeof d !== "object") {
    throw new Error("Respuesta inválida del servidor.")
  }
  const ind = d.indicators as Record<string, unknown> | null | undefined
  return {
    grouping: String(d.grouping ?? params.grouping) as ReportPeriodUi,
    startDate: String(d.startDate ?? ""),
    endDate: String(d.endDate ?? ""),
    refDate: d.refDate != null ? String(d.refDate) : null,
    indicators: ind
      ? {
          totalCobrado: Number(ind.totalCobrado ?? 0),
          totalCosto: Number(ind.totalCosto ?? 0),
          totalMargen: Number(ind.totalMargen ?? 0),
          totalGastos: Number(ind.totalGastos ?? 0),
          totalAbonos: Number(ind.totalAbonos ?? 0),
          totalFiado: Number(ind.totalFiado ?? 0),
          countVentas: Number(ind.countVentas ?? 0),
          countFiado: Number(ind.countFiado ?? 0),
          resultadoOperativo: Number(ind.resultadoOperativo ?? 0),
        }
      : null,
    tendencia: Array.isArray(d.tendencia)
      ? (d.tendencia as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          sales: Number(r.sales ?? 0),
        }))
      : [],
    ventasVsGastos: Array.isArray(d.ventasVsGastos)
      ? (d.ventasVsGastos as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          sales: Number(r.sales ?? 0),
          expenses: Number(r.expenses ?? 0),
        }))
      : [],
    desglose: Array.isArray(d.desglose)
      ? (d.desglose as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          ventasCobradas: Number(r.ventasCobradas ?? r.sales ?? 0),
          gastos: Number(r.gastos ?? r.expenses ?? 0),
          ganancia: Number(r.ganancia ?? 0),
          margenPct:
            r.margenPct === null || r.margenPct === undefined
              ? null
              : Number(r.margenPct),
        }))
      : [],
    gastosPorTipo: Array.isArray(d.gastosPorTipo)
      ? (d.gastosPorTipo as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          amount: Number(r.amount ?? 0),
        }))
      : [],
    margenSerie: Array.isArray(d.margenSerie)
      ? (d.margenSerie as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          margin: Number(r.margin ?? 0),
        }))
      : [],
    fiadoAbonosSerie: Array.isArray(d.fiadoAbonosSerie)
      ? (d.fiadoAbonosSerie as Record<string, unknown>[]).map((r) => ({
          label: String(r.label ?? ""),
          abonos: Number(r.abonos ?? 0),
          fiado: Number(r.fiado ?? 0),
        }))
      : [],
  }
}
