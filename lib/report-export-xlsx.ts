import {
  reportPeriodTitle,
  type ReportChartRow,
  type ReportPeriodUi,
  type ReportSummary,
} from "@/lib/report-metrics"

export async function downloadBusinessReportXlsx(
  summary: ReportSummary,
  rows: ReportChartRow[],
  period: ReportPeriodUi,
  generatedAt: Date = new Date()
) {
  const XLSX = await import("xlsx")
  const title = reportPeriodTitle(period)
  const aoa: (string | number)[][] = [
    ["MiniMer — Reporte de rendimiento"],
    ["Vista", title],
    ["Periodo", summary.periodCaption],
    ["Generado", generatedAt.toLocaleString("es-GT")],
    [],
    ["Ventas cobradas (Q)", summary.totalCobrado],
    ["Costo inventario ventas cobradas (Q)", summary.totalCosto],
    ["Ganancia bruta ventas (Q)", summary.totalMargen],
    ["Gastos registrados (Q)", summary.totalGastos],
    ["Abonos recibidos (Q)", summary.totalAbonos],
    ["Ventas al fiado — monto (Q)", summary.totalFiado],
    ["Movimientos de venta (total)", summary.countVentas],
    ["Ventas al fiado (cantidad)", summary.countFiado],
    ["Resultado ganancia − gastos (Q)", summary.resultadoOperativo],
    [],
    ["Desglose"],
    ["Etiqueta", "Ventas cobradas", "Gastos", "Ganancia", "Margen %"],
  ]

  for (const r of rows) {
    const profit = r.sales - r.expenses
    const marginPct = r.sales > 0 ? (profit / r.sales) * 100 : null
    aoa.push([
      r.label,
      r.sales,
      r.expenses,
      profit,
      marginPct != null ? Number(marginPct.toFixed(1)) : "—",
    ])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const colW = [{ wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
  ws["!cols"] = colW
  XLSX.utils.book_append_sheet(wb, ws, "Reporte")
  XLSX.writeFile(
    wb,
    `reporte-rendimiento-${period}-${generatedAt.toISOString().slice(0, 10)}.xlsx`
  )
}
