import { formatQ } from "@/lib/currency"
import type { SaleRecord } from "@/lib/mock-data"
import { salesPeriodLabel, type SalesPrintPeriod } from "@/lib/sales-period"

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
  body { font-family: Montserrat, sans-serif; padding: 20px; color: #111; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 8px; }
  h2 { font-size: 14px; margin: 16px 0 8px; }
  .muted { color: #555; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f4f4f4; font-weight: 600; }
  .right { text-align: right; }
  .total { font-weight: 700; font-size: 14px; margin-top: 12px; }
  hr { border: none; border-top: 1px dashed #999; margin: 12px 0; }
`

export function openPrintHtml(title: string, bodyInnerHtml: string): boolean {
  const w = window.open("", "_blank", "noopener,noreferrer")
  if (!w) return false
  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
${bodyInnerHtml}
</body>
</html>`)
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
    w.close()
  }, 250)
  return true
}

export function printInventoryReport(
  products: {
    name: string
    category: string
    costPrice: number
    salePrice: number
    stock: number
    minStock: number
    supplier: string
  }[],
  generatedAt: Date = new Date()
) {
  const rows = products
    .map(
      (p) =>
        `<tr><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td class="right">${esc(formatQ(p.costPrice))}</td><td class="right">${esc(formatQ(p.salePrice))}</td><td class="right">${p.stock}</td><td class="right">${p.minStock}</td><td>${esc(p.supplier)}</td></tr>`
    )
    .join("")
  const body = `
    <h1>Inventario — GestiónPro</h1>
    <p class="muted">Generado: ${esc(generatedAt.toLocaleString("es-GT"))}</p>
    <p>Total de productos: <strong>${products.length}</strong></p>
    <table>
      <thead>
        <tr>
          <th>Producto</th><th>Categoría</th><th class="right">P. costo</th><th class="right">P. venta</th>
          <th class="right">Stock</th><th class="right">Mín.</th><th>Proveedor</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
  openPrintHtml("Inventario", body)
}

function paymentLabel(method: string): string {
  if (method === "efectivo") return "Efectivo"
  if (method === "tarjeta") return "Tarjeta"
  if (method === "fiado") return "Fiado"
  return method
}

export function printSaleReceipt(sale: SaleRecord) {
  const lines = sale.items
    .map(
      (i) =>
        `<tr><td>${esc(i.name)}</td><td class="right">${i.quantity}</td><td class="right">${esc(formatQ(i.price))}</td><td class="right">${esc(formatQ(i.price * i.quantity))}</td></tr>`
    )
    .join("")
  const when = sale.timestamp.toLocaleString("es-GT")
  const body = `
    <h1>Recibo de venta</h1>
    <p class="muted">GestiónPro</p>
    <hr/>
    <p><strong>No.</strong> ${sale.id} &nbsp;·&nbsp; <strong>Fecha:</strong> ${esc(when)}</p>
    <p><strong>Cliente:</strong> ${esc(sale.customer)}</p>
    <p><strong>Pago:</strong> ${esc(paymentLabel(sale.paymentMethod))}</p>
    <table>
      <thead><tr><th>Producto</th><th class="right">Cant.</th><th class="right">P. unit.</th><th class="right">Subtotal</th></tr></thead>
      <tbody>${lines}</tbody>
    </table>
    <p class="total">Total: ${esc(formatQ(sale.total))}</p>
    <p class="muted">¡Gracias por su compra!</p>
  `
  openPrintHtml(`Recibo #${sale.id}`, body)
}

export function printSalesList(
  sales: SaleRecord[],
  period: SalesPrintPeriod,
  ref: Date = new Date()
) {
  const label = salesPeriodLabel(period)
  const rows = sales
    .slice()
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((s) => {
      const when = s.timestamp.toLocaleString("es-GT")
      const items = s.items.map((i) => `${i.name} ×${i.quantity}`).join("; ")
      return `<tr>
        <td>${s.id}</td>
        <td>${esc(when)}</td>
        <td>${esc(s.customer)}</td>
        <td>${esc(paymentLabel(s.paymentMethod))}</td>
        <td>${esc(items)}</td>
        <td class="right">${esc(formatQ(s.total))}</td>
      </tr>`
    })
    .join("")
  const sum = sales.reduce((a, s) => a + s.total, 0)
  const body = `
    <h1>Listado de ventas (${esc(label)})</h1>
    <p class="muted">GestiónPro — Referencia: ${esc(ref.toLocaleDateString("es-GT"))}</p>
    <p>Registros: <strong>${sales.length}</strong> &nbsp;|&nbsp; Total periodo: <strong>${esc(formatQ(sum))}</strong></p>
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Detalle</th><th class="right">Total</th>
        </tr>
      </thead>
      <tbody>${rows || "<tr><td colspan='6'>Sin ventas en el periodo</td></tr>"}</tbody>
    </table>
  `
  openPrintHtml(`Ventas ${label}`, body)
}
