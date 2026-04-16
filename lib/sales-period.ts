import { isSameCalendarDay } from "@/lib/currency"

export type SalesPrintPeriod = "day" | "week" | "month" | "year"

export function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeekSunday(ref: Date): Date {
  const start = startOfWeekMonday(ref)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/** Filtra ventas por día natural, semana (lun–dom), mes o año del calendario de `ref`. */
export function filterSalesByPeriod<T extends { timestamp: Date }>(
  sales: T[],
  period: SalesPrintPeriod,
  ref: Date = new Date()
): T[] {
  if (period === "day") {
    return sales.filter((s) => isSameCalendarDay(s.timestamp, ref))
  }
  if (period === "week") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return sales.filter((s) => s.timestamp >= a && s.timestamp <= b)
  }
  if (period === "month") {
    return sales.filter(
      (s) =>
        s.timestamp.getMonth() === ref.getMonth() &&
        s.timestamp.getFullYear() === ref.getFullYear()
    )
  }
  return sales.filter((s) => s.timestamp.getFullYear() === ref.getFullYear())
}

export function salesPeriodLabel(period: SalesPrintPeriod): string {
  switch (period) {
    case "day":
      return "Día"
    case "week":
      return "Semanal"
    case "month":
      return "Mensual"
    case "year":
      return "Anual"
    default:
      return period
  }
}

/** Texto descriptivo del rango visible (para historial / balance). */
/** Fecha local en formato YYYY-MM-DD (para consultas a la API). */
export function toSqlDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Rango inclusive de fechas según el periodo del historial de ventas. */
export function getSalesApiDateRange(
  period: SalesPrintPeriod,
  ref: Date
): { dateStart: string; dateEnd: string } {
  const r = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  if (period === "day") {
    const s = toSqlDateString(r)
    return { dateStart: s, dateEnd: s }
  }
  if (period === "week") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return { dateStart: toSqlDateString(a), dateEnd: toSqlDateString(b) }
  }
  if (period === "month") {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
    return { dateStart: toSqlDateString(start), dateEnd: toSqlDateString(end) }
  }
  const start = new Date(ref.getFullYear(), 0, 1)
  const end = new Date(ref.getFullYear(), 11, 31)
  return { dateStart: toSqlDateString(start), dateEnd: toSqlDateString(end) }
}

export function formatSalesHistoryPeriodCaption(
  period: SalesPrintPeriod,
  ref: Date
): string {
  if (period === "day") {
    return ref.toLocaleDateString("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }
  if (period === "week") {
    const a = startOfWeekMonday(ref)
    const b = endOfWeekSunday(ref)
    return `${a.toLocaleDateString("es-GT", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}`
  }
  if (period === "month") {
    return ref.toLocaleDateString("es-GT", { month: "long", year: "numeric" })
  }
  return String(ref.getFullYear())
}
