import {
  getSixMonthWindow,
  type ReportPeriodUi,
} from "@/lib/report-metrics"
import {
  startOfRollingWeek,
  endOfRollingWeek,
} from "@/lib/sales-period"

/** Coincide con los query params del backend `/reports/full`. */
export type ReportGroupingParam = ReportPeriodUi

export function computeReportWindow(
  grouping: ReportGroupingParam,
  refDate: Date,
  range?: { start: Date; end: Date }
): { start: Date; end: Date; refForKpi: Date } {
  const refMid = new Date(
    refDate.getFullYear(),
    refDate.getMonth(),
    refDate.getDate(),
    12,
    0,
    0,
    0
  )

  if (grouping === "rango") {
    if (!range) {
      throw new Error("computeReportWindow(rango): se requiere range")
    }
    const start = new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      range.start.getDate(),
      0,
      0,
      0,
      0
    )
    const end = new Date(
      range.end.getFullYear(),
      range.end.getMonth(),
      range.end.getDate(),
      23,
      59,
      59,
      999
    )
    return { start, end, refForKpi: refMid }
  }

  if (grouping === "diario") {
    const start = new Date(
      refMid.getFullYear(),
      refMid.getMonth(),
      refMid.getDate(),
      0,
      0,
      0,
      0
    )
    const end = new Date(
      refMid.getFullYear(),
      refMid.getMonth(),
      refMid.getDate(),
      23,
      59,
      59,
      999
    )
    return { start, end, refForKpi: refMid }
  }

  if (grouping === "semanal") {
    const start = startOfRollingWeek(refMid)
    const end = endOfRollingWeek(refMid)
    return { start, end, refForKpi: refMid }
  }

  if (grouping === "mensual") {
    const { start, end } = getSixMonthWindow(refMid)
    return { start, end, refForKpi: refMid }
  }

  const y = refMid.getFullYear()
  const start = new Date(y, 0, 1, 0, 0, 0, 0)
  const end = new Date(y, 11, 31, 23, 59, 59, 999)
  return { start, end, refForKpi: refMid }
}

export function formatMysqlDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatMysqlDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
