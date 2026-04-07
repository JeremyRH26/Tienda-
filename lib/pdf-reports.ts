import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatQ } from "@/lib/currency"
import type { PendingCreditLine, SaleRecord } from "@/lib/mock-data"
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

export function downloadInventoryPdf(
  products: ProductRow[],
  generatedAt: Date = new Date()
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  doc.setFontSize(16)
  doc.text("Inventario — GestiónPro", 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Generado: ${generatedAt.toLocaleString("es-GT")}`, 14, 22)
  doc.text(`Total de productos: ${products.length}`, 14, 27)
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 31,
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

export function downloadSaleReceiptPdf(sale: SaleRecord) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const when = sale.timestamp.toLocaleString("es-GT")
  doc.setFontSize(16)
  doc.text("Recibo de venta", 14, 18)
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text("GestiónPro", 14, 24)
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

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY
  const y = (finalY ?? 80) + 8
  doc.setFontSize(12)
  doc.text(`Total: ${formatQ(sale.total)}`, 14, y)
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("¡Gracias por su compra!", 14, y + 7)

  doc.save(`recibo-venta-${sale.id}.pdf`)
}

export function downloadSalesListPdf(
  sales: SaleRecord[],
  period: SalesPrintPeriod,
  ref: Date = new Date()
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const label = salesPeriodLabel(period)
  const sorted = sales
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  const sum = sales.reduce((a, s) => a + s.total, 0)

  doc.setFontSize(15)
  doc.text(`Listado de ventas (${label})`, 14, 14)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`GestiónPro — Referencia: ${ref.toLocaleDateString("es-GT")}`, 14, 20)
  doc.text(
    `Registros: ${sales.length}  |  Total periodo: ${formatQ(sum)}`,
    14,
    25
  )
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 29,
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

export function downloadCustomerCreditPdf(
  customerName: string,
  balance: number,
  lines: PendingCreditLine[],
  generatedAt: Date = new Date()
) {
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
    doc.text(
      `${line.fecha} — ${line.descripcion}`,
      14,
      startY
    )
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

    const ext = doc as jsPDF & { lastAutoTable?: { finalY: number } }
    startY = (ext.lastAutoTable?.finalY ?? startY) + 12
    if (startY > 250) {
      doc.addPage()
      startY = 20
    }
  }

  doc.save(`fiados-${customerName.replace(/\s+/g, "-").slice(0, 40)}.pdf`)
}
