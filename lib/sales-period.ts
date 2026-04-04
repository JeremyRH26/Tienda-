import { isSameCalendarDay } from "@/lib/currency"

export type SalesPrintPeriod = "day" | "week" | "month" | "year"

function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeekSunday(ref: Date): Date {
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
