import { isSameCalendarDay } from "@/lib/currency"
import { startOfWeekMonday, endOfWeekSunday, startOfRollingWeek, endOfRollingWeek } from "@/lib/sales-period"
import type { SaleRecord } from "@/lib/mock-data"
import type { ExpenseEntry, AbonoEntry } from "@/lib/business-context"
import { aggregateProfitForSales } from "@/lib/sale-profit"
import type { CatalogProduct } from "@/lib/sale-profit"

export type ReportPeriodUi =
  | "diario"
  | "semanal"
  | "mensual"
  | "anual"
  | "rango"

export type ReportChartRow = { label: string; sales: number; expenses: number }

function isPaid(s: SaleRecord): boolean {
  return s.paymentMethod === "efectivo" || s.paymentMethod === "tarjeta"
}

export function getSixMonthWindow(ref: Date): { start: Date; end: Date } {
  // Fin = HOY a 23:59:59 (no el último día del mes, para no incluir días futuros)
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999)
  const start = new Date(ref.getFullYear(), ref.getMonth() - 5, 1, 0, 0, 0, 0)
  return { start, end }
}

export function filterSalesForReport(
  sales: SaleRecord[],
  period: ReportPeriodUi,
  ref: Date
): SaleRecord[] {
  if (period === "rango") {
    return []
  }
  if (period === "diario") {
    return sales.filter((s) => isSameCalendarDay(s.timestamp, ref))
  }
  if (period === "semanal") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return sales.filter((s) => s.timestamp >= a && s.timestamp <= b)
  }
  if (period === "mensual") {
    const { start, end } = getSixMonthWindow(ref)
    return sales.filter((s) => s.timestamp >= start && s.timestamp <= end)
  }
  const y = ref.getFullYear()
  return sales.filter((s) => s.timestamp.getFullYear() === y)
}

export function filterExpensesForReport(
  expenses: ExpenseEntry[],
  period: ReportPeriodUi,
  ref: Date
): ExpenseEntry[] {
  if (period === "rango") {
    return []
  }
  if (period === "diario") {
    return expenses.filter((e) => isSameCalendarDay(e.date, ref))
  }
  if (period === "semanal") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return expenses.filter((e) => e.date >= a && e.date <= b)
  }
  if (period === "mensual") {
    const { start, end } = getSixMonthWindow(ref)
    return expenses.filter((e) => e.date >= start && e.date <= end)
  }
  return expenses.filter((e) => e.date.getFullYear() === ref.getFullYear())
}

export function filterAbonosForReport(
  abonos: AbonoEntry[],
  period: ReportPeriodUi,
  ref: Date
): AbonoEntry[] {
  if (period === "rango") {
    return []
  }
  if (period === "diario") {
    return abonos.filter((a) => isSameCalendarDay(a.timestamp, ref))
  }
  if (period === "semanal") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return abonos.filter((x) => x.timestamp >= a && x.timestamp <= b)
  }
  if (period === "mensual") {
    const { start, end } = getSixMonthWindow(ref)
    return abonos.filter((x) => x.timestamp >= start && x.timestamp <= end)
  }
  return abonos.filter((x) => x.timestamp.getFullYear() === ref.getFullYear())
}

export function buildReportChartRows(
  sales: SaleRecord[],
  expenses: ExpenseEntry[],
  period: ReportPeriodUi,
  ref: Date
): ReportChartRow[] {
  if (period === "rango") {
    return []
  }
  const filteredSales = filterSalesForReport(sales, period, ref)
  const filteredExpenses = filterExpensesForReport(expenses, period, ref)

  if (period === "diario") {
    const paid = filteredSales.filter(isPaid)
    const byHour: ReportChartRow[] = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, "0")}:00`,
      sales: 0,
      expenses: 0,
    }))
    for (const s of paid) {
      const h = s.timestamp.getHours()
      byHour[h].sales += s.total
    }
    return byHour
  }

  if (period === "semanal") {
    const start = startOfWeekMonday(ref)
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    const rows: ReportChartRow[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const label = `${dayNames[i]} ${d.getDate()}`
      const cobrado = filteredSales
        .filter(isPaid)
        .filter((s) => isSameCalendarDay(s.timestamp, d))
        .reduce((a, s) => a + s.total, 0)
      const gastos = filteredExpenses
        .filter((e) => isSameCalendarDay(e.date, d))
        .reduce((a, e) => a + e.amount, 0)
      rows.push({ label, sales: cobrado, expenses: gastos })
    }
    return rows
  }

  if (period === "mensual") {
    const { start, end } = getSixMonthWindow(ref)
    const rows: ReportChartRow[] = []
    let cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = cur.getMonth()
      const label = cur.toLocaleDateString("es-GT", {
        month: "short",
        year: "2-digit",
      })
      const cobrado = filteredSales
        .filter(isPaid)
        .filter((s) => s.timestamp.getFullYear() === y && s.timestamp.getMonth() === m)
        .reduce((a, s) => a + s.total, 0)
      const gastos = filteredExpenses
        .filter((e) => e.date.getFullYear() === y && e.date.getMonth() === m)
        .reduce((a, e) => a + e.amount, 0)
      rows.push({ label, sales: cobrado, expenses: gastos })
      cur = new Date(y, m + 1, 1)
    }
    return rows
  }

  const y = ref.getFullYear()
  const rows: ReportChartRow[] = []
  for (let m = 0; m < 12; m++) {
    const cur = new Date(y, m, 1)
    const label = cur.toLocaleDateString("es-GT", { month: "short" })
    const cobrado = filteredSales
      .filter(isPaid)
      .filter(
        (s) => s.timestamp.getFullYear() === y && s.timestamp.getMonth() === m
      )
      .reduce((a, s) => a + s.total, 0)
    const gastos = filteredExpenses
      .filter((e) => e.date.getFullYear() === y && e.date.getMonth() === m)
      .reduce((a, e) => a + e.amount, 0)
    rows.push({ label, sales: cobrado, expenses: gastos })
  }
  return rows
}

export function formatReportPeriodCaption(
  period: ReportPeriodUi,
  ref: Date,
  range?: { start: Date; end: Date }
): string {
  if (period === "rango" && range) {
    const a = range.start.toLocaleDateString("es-GT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    const b = range.end.toLocaleDateString("es-GT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${a} – ${b}`
  }
  if (period === "diario") {
    return ref.toLocaleDateString("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }
  if (period === "semanal") {
    const a = startOfRollingWeek(ref)
    const b = endOfRollingWeek(ref)
    return `${a.toLocaleDateString("es-GT", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}`
  }
  if (period === "mensual") {
    const { start, end } = getSixMonthWindow(ref)
    return `${start.toLocaleDateString("es-GT", { month: "short", year: "numeric" })} – ${end.toLocaleDateString("es-GT", { month: "short", year: "numeric" })}`
  }
  return String(ref.getFullYear())
}

export function reportPeriodTitle(period: ReportPeriodUi): string {
  switch (period) {
    case "diario":
      return "Diario"
    case "semanal":
      return "Semanal"
    case "mensual":
      return "Mensual (6 meses)"
    case "anual":
      return "Anual"
    case "rango":
      return "Por rango de fechas"
    default:
      return period
  }
}

export type ReportSummary = {
  periodCaption: string
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

export function buildReportSummary(
  sales: SaleRecord[],
  expenses: ExpenseEntry[],
  abonos: AbonoEntry[],
  catalog: CatalogProduct[],
  period: ReportPeriodUi,
  ref: Date
): ReportSummary {
  const filteredSales = filterSalesForReport(sales, period, ref)
  const paid = filteredSales.filter(isPaid)
  const fiadoSales = filteredSales.filter((s) => s.paymentMethod === "fiado")
  const agg = aggregateProfitForSales(paid, catalog)
  const fa = filterAbonosForReport(abonos, period, ref)
  const feForKpiTotal = filterExpensesForReport(expenses, period, ref)
  const totalGastos = feForKpiTotal.reduce((a, e) => a + e.amount, 0)
  const totalAbonos = fa.reduce((a, x) => a + x.amount, 0)
  const totalFiado = fiadoSales.reduce((a, s) => a + s.total, 0)

  return {
    periodCaption: formatReportPeriodCaption(period, ref),
    totalCobrado: paid.reduce((a, s) => a + s.total, 0),
    totalCosto: agg.totalCost,
    totalMargen: agg.totalMargin,
    totalGastos,
    totalAbonos,
    totalFiado,
    countVentas: filteredSales.length,
    countFiado: fiadoSales.length,
    resultadoOperativo: agg.totalMargin - totalGastos,
  }
}
