import type { SaleRecord } from "@/lib/mock-data"

export type CatalogProduct = { name: string; costPrice: number }

export type SaleLineProfit = {
  name: string
  quantity: number
  price: number
  unitCost: number | null
  lineCost: number
  lineRevenue: number
  lineMargin: number
}

export function lookupCostPrice(
  productName: string,
  catalog: CatalogProduct[]
): number | null {
  const n = productName.trim()
  const p = catalog.find((x) => x.name === n)
  return p != null ? p.costPrice : null
}

/** Desglose por línea y totales de una venta respecto al catálogo (costo inventario). */
export function saleProfitBreakdown(
  sale: SaleRecord,
  catalog: CatalogProduct[]
): {
  lines: SaleLineProfit[]
  totalUnits: number
  totalCost: number
  totalMargin: number
  totalRevenue: number
} {
  let totalUnits = 0
  let totalCost = 0
  let totalMargin = 0
  let totalRevenue = 0
  const lines: SaleLineProfit[] = []

  for (const item of sale.items) {
    const qty = item.quantity
    const revenue = item.price * qty
    totalUnits += qty
    totalRevenue += revenue
    const unitCost = lookupCostPrice(item.name, catalog)
    const lineCost = unitCost != null ? unitCost * qty : 0
    const lineMargin =
      unitCost != null ? (item.price - unitCost) * qty : 0
    totalCost += lineCost
    totalMargin += lineMargin
    lines.push({
      name: item.name,
      quantity: qty,
      price: item.price,
      unitCost,
      lineCost,
      lineRevenue: revenue,
      lineMargin,
    })
  }

  return { lines, totalUnits, totalCost, totalMargin, totalRevenue }
}

export function aggregateProfitForSales(
  sales: SaleRecord[],
  catalog: CatalogProduct[]
): { totalCost: number; totalMargin: number; totalRevenue: number } {
  let totalCost = 0
  let totalMargin = 0
  let totalRevenue = 0
  for (const sale of sales) {
    const b = saleProfitBreakdown(sale, catalog)
    totalCost += b.totalCost
    totalMargin += b.totalMargin
    totalRevenue += b.totalRevenue
  }
  return { totalCost, totalMargin, totalRevenue }
}
