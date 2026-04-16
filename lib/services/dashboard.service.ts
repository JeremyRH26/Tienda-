import { API_BASE } from "@/lib/api-config"

export type DashboardChartPoint = {
  day: string
  sales: number
}

export type DashboardLowStockItem = {
  id: number
  name: string
  categoryName: string
  quantity: number
  minStock: number
}

export type DashboardActivityItem =
  | {
      type: "sale"
      occurredAt: string
      amount: number
      paymentLabel: string
      detail: string
    }
  | {
      type: "expense"
      occurredAt: string
      amount: number
      detail: string
      note: string
    }

export type DashboardSummaryDto = {
  weekStart: string
  weekEnd: string
  salesWeekTotal: number
  salesPrevWeekTotal: number
  weekOverWeekPct: number | null
  salesChart: DashboardChartPoint[]
  receivableTotal: number
  receivableCustomersCount: number
  lowStock: DashboardLowStockItem[]
  activity: DashboardActivityItem[]
}

async function readJson(res: Response): Promise<{ message?: string; data?: unknown }> {
  try {
    return (await res.json()) as { message?: string; data?: unknown }
  } catch {
    return {}
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryDto> {
  const res = await fetch(`${API_BASE}/dashboard/summary`)
  const json = await readJson(res)
  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" ? json.message : "No se pudo cargar el resumen del dashboard.",
    )
  }
  const d = json.data as Record<string, unknown> | undefined
  if (!d) {
    throw new Error("Respuesta inválida del servidor.")
  }
  const salesChart = Array.isArray(d.salesChart)
    ? (d.salesChart as Record<string, unknown>[]).map((row) => ({
        day: String(row.day ?? ""),
        sales: Number(row.sales ?? 0),
      }))
    : []
  const lowStock = Array.isArray(d.lowStock)
    ? (d.lowStock as Record<string, unknown>[]).map((row) => ({
        id: Number(row.id),
        name: String(row.name ?? ""),
        categoryName: String(row.categoryName ?? row.category_name ?? ""),
        quantity: Number(row.quantity ?? 0),
        minStock: Number(row.minStock ?? row.min_stock ?? 0),
      }))
    : []
  const activity = Array.isArray(d.activity)
    ? (d.activity as Record<string, unknown>[]).map((row) => {
        const type = row.type === "expense" ? "expense" : "sale"
        if (type === "expense") {
          return {
            type: "expense" as const,
            occurredAt: String(row.occurredAt ?? ""),
            amount: Number(row.amount ?? 0),
            detail: String(row.detail ?? ""),
            note: String(row.note ?? ""),
          }
        }
        return {
          type: "sale" as const,
          occurredAt: String(row.occurredAt ?? ""),
          amount: Number(row.amount ?? 0),
          paymentLabel: String(row.paymentLabel ?? ""),
          detail: String(row.detail ?? ""),
        }
      })
    : []
  return {
    weekStart: String(d.weekStart ?? ""),
    weekEnd: String(d.weekEnd ?? ""),
    salesWeekTotal: Number(d.salesWeekTotal ?? 0),
    salesPrevWeekTotal: Number(d.salesPrevWeekTotal ?? 0),
    weekOverWeekPct:
      d.weekOverWeekPct === null || d.weekOverWeekPct === undefined
        ? null
        : Number(d.weekOverWeekPct),
    salesChart,
    receivableTotal: Number(d.receivableTotal ?? 0),
    receivableCustomersCount: Number(d.receivableCustomersCount ?? 0),
    lowStock,
    activity,
  }
}
