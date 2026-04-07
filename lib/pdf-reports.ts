import { formatQ } from "@/lib/currency"
import type { PendingCreditLine, SaleRecord } from "@/lib/mock-data"
import {
  reportPeriodTitle,
  type ReportChartRow,
  type ReportPeriodUi,
  type ReportSummary,
} from "@/lib/report-metrics"
import { aggregateProfitForSales, type CatalogProduct } from "@/lib/sale-profit"
import { salesPeriodLabel, type SalesPrintPeriod } from "@/lib/sales-period"

function paymentLabel(method: string): string {
  if (method === "efectivo") return "Efectivo"
  if (method === "tarjeta") return "Tarjeta"
  if (method === "fiado") return "Fiado"
  return method
}

type ProductRow = {
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  minStock: number
  supplier: string
}

/** Carga perezosa: bundle ES (navegador) para no arrastrar jspdf.node + fflate Worker en Turbopack/SSR. */
async function loadPdfLibs() {
  const [jspdfMod, autoTableMod] = await Promise.all([
    import("jspdf/dist/jspdf.es.min.js"),
    import("jspdf-autotable"),
  ])
  const jsPDF = jspdfMod.jsPDF
  return { jsPDF, autoTable: autoTableMod.default }
}

export async function downloadInventoryPdf(
  products: ProductRow[],
  generatedAt: Date = new Date()
) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  doc.setFontSize(16)
  doc.text("Inventario — MiniMer", 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Generado: ${generatedAt.toLocaleString("es-GT")}`, 14, 22)
  doc.text(`Total de productos: ${products.length}`, 14, 27)
  const valorTotalInventario = products.reduce(
    (acc, p) => acc + p.costPrice * p.stock,
    0
  )
  doc.text(`Valor total del inventario: ${formatQ(valorTotalInventario)}`, 14, 32)
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 37,
    head: [
      [
        "Producto",
        "Categoría",
        "P. costo",
        "P. venta",
        "Stock",
        "Mín.",
        "Proveedor",
      ],
    ],
    body: products.map((p) => [
      p.name,
      p.category,
      formatQ(p.costPrice),
      formatQ(p.salePrice),
      String(p.stock),
      String(p.minStock),
      p.supplier,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 41, 41], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  doc.save(`inventario-${generatedAt.toISOString().slice(0, 10)}.pdf`)
}

export async function downloadSaleReceiptPdf(sale: SaleRecord) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const when = sale.timestamp.toLocaleString("es-GT")
  doc.setFontSize(16)
  doc.text("Recibo de venta", 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text("MiniMer", 14, 24)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(`No. ${sale.id}  ·  Fecha: ${when}`, 14, 32)
  doc.text(`Cliente: ${sale.customer}`, 14, 38)
  doc.text(`Pago: ${paymentLabel(sale.paymentMethod)}`, 14, 44)

  autoTable(doc, {
    startY: 48,
    head: [["Producto", "Cant.", "P. unit.", "Subtotal"]],
    body: sale.items.map((i) => [
      i.name,
      String(i.quantity),
      formatQ(i.price),
      formatQ(i.price * i.quantity),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 41, 41], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY
  const y = (finalY ?? 80) + 8
  doc.setFontSize(12)
  doc.text(`Total: ${formatQ(sale.total)}`, 14, y)
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("¡Gracias por su compra!", 14, y + 7)

  doc.save(`recibo-venta-${sale.id}.pdf`)
}

export async function downloadSalesListPdf(
  sales: SaleRecord[],
  period: SalesPrintPeriod,
  ref: Date = new Date(),
  catalog: CatalogProduct[]
) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const label = salesPeriodLabel(period)
  const sorted = sales
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const paidSales = sales.filter(
    (s) => s.paymentMethod === "efectivo" || s.paymentMethod === "tarjeta"
  )
  const sumCobrado = paidSales.reduce((a, s) => a + s.total, 0)
  const { totalCost, totalMargin } = aggregateProfitForSales(paidSales, catalog)

  doc.setFontSize(15)
  doc.text(`Listado de ventas (${label})`, 14, 14)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`MiniMer — Referencia: ${ref.toLocaleDateString("es-GT")}`, 14, 20)
  doc.text(`Registros: ${sales.length}`, 14, 25)
  doc.text(`Costo total: ${formatQ(totalCost)}`, 14, 30)
  doc.text(`Ganancia total: ${formatQ(totalMargin)}`, 14, 35)
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total cobrado: ${formatQ(sumCobrado)}`, 14, 42)

  autoTable(doc, {
    startY: 48,
    head: [["ID", "Fecha", "Cliente", "Pago", "Detalle", "Total"]],
    body:
      sorted.length > 0
        ? sorted.map((s) => {
            const when = s.timestamp.toLocaleString("es-GT")
            const items = s.items.map((i) => `${i.name} ×${i.quantity}`).join("; ")
            return [
              String(s.id),
              when,
              s.customer,
              paymentLabel(s.paymentMethod),
              items,
              formatQ(s.total),
            ]
          })
        : [["—", "—", "—", "—", "Sin ventas en el periodo", "—"]],
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 41, 41], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 36 },
      2: { cellWidth: 36 },
      3: { cellWidth: 22 },
      5: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  })

  doc.save(`ventas-${label.replace(/\s+/g, "-")}.pdf`)
}

export async function downloadCustomerCreditPdf(
  customerName: string,
  balance: number,
  lines: PendingCreditLine[],
  generatedAt: Date = new Date()
) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  doc.setFontSize(15)
  doc.text("Estado de cuenta — Fiados", 14, 16)
  doc.setFontSize(10)
  doc.text(`Cliente: ${customerName}`, 14, 24)
  doc.text(`Saldo total pendiente: ${formatQ(balance)}`, 14, 30)
  doc.setFontSize(8)
  doc.setTextColor(90, 90, 90)
  doc.text(`Generado: ${generatedAt.toLocaleString("es-GT")}`, 14, 36)
  doc.setTextColor(0, 0, 0)

  let startY = 42
  if (lines.length === 0) {
    doc.setFontSize(10)
    doc.text("No hay ventas al fiado detalladas en el historial.", 14, startY)
    doc.save(`fiados-${customerName.replace(/\s+/g, "-").slice(0, 40)}.pdf`)
    return
  }

  for (const line of lines) {
    doc.setFontSize(10)
    doc.text(`${line.fecha} — ${line.descripcion}`, 14, startY)
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Original ${formatQ(line.totalOriginal)} · Pendiente ${formatQ(line.saldoPendiente)}`,
      14,
      startY + 5
    )
    doc.setTextColor(0, 0, 0)

    autoTable(doc, {
      startY: startY + 8,
      head: [["Producto", "Cant.", "P. unit.", "Subtotal"]],
      body:
        line.items.length > 0
          ? line.items.map((i) => [
              i.name,
              String(i.quantity),
              formatQ(i.price),
              formatQ(i.quantity * i.price),
            ])
          : [["(Sin detalle de productos)", "—", "—", "—"]],
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [55, 55, 55], textColor: 255 },
      margin: { left: 14, right: 14 },
    })

    const ext = doc as { lastAutoTable?: { finalY: number } }
    startY = (ext.lastAutoTable?.finalY ?? startY) + 12
    if (startY > 250) {
      doc.addPage()
      startY = 20
    }
  }

  doc.save(`fiados-${customerName.replace(/\s+/g, "-").slice(0, 40)}.pdf`)
}

export async function downloadBusinessReportPdf(
  summary: ReportSummary,
  rows: ReportChartRow[],
  period: ReportPeriodUi,
  generatedAt: Date = new Date()
) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  doc.setFontSize(16)
  doc.text("Reporte de rendimiento — MiniMer", 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(
    `${reportPeriodTitle(period)} · ${summary.periodCaption}`,
    14,
    23
  )
  doc.text(`Generado: ${generatedAt.toLocaleString("es-GT")}`, 14, 28)
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 33,
    body: [
      ["Ventas cobradas", formatQ(summary.totalCobrado)],
      ["Costo inventario (ventas cobradas)", formatQ(summary.totalCosto)],
      ["Ganancia bruta ventas", formatQ(summary.totalMargen)],
      ["Gastos registrados", formatQ(summary.totalGastos)],
      ["Abonos recibidos", formatQ(summary.totalAbonos)],
      ["Ventas al fiado (monto)", formatQ(summary.totalFiado)],
      ["Movimientos de venta (total)", String(summary.countVentas)],
      ["Ventas al fiado (cantidad)", String(summary.countFiado)],
      ["Resultado (ganancia − gastos)", formatQ(summary.resultadoOperativo)],
    ],
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    theme: "plain",
    margin: { left: 14, right: 14 },
  })

  const ext = doc as { lastAutoTable?: { finalY: number } }
  const afterSummary = (ext.lastAutoTable?.finalY ?? 80) + 10
  doc.setFontSize(11)
  doc.text("Desglose", 14, afterSummary)

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [["Periodo / hora", "Ventas", "Gastos", "Ganancia", "Margen %"]],
    body: rows.map((r) => {
      const profit = r.sales - r.expenses
      const marginPct =
        r.sales > 0 ? `${((profit / r.sales) * 100).toFixed(1)}%` : "—"
      return [
        r.label,
        formatQ(r.sales),
        formatQ(r.expenses),
        formatQ(profit),
        marginPct,
      ]
    }),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [41, 41, 41], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  doc.save(
    `reporte-rendimiento-${period}-${generatedAt.toISOString().slice(0, 10)}.pdf`
  )
}
