import { API_BASE } from "@/lib/api-config"
import type { SaleRecord } from "@/lib/mock-data"

export type AbonoEntry = {
  id: string
  timestamp: Date
  customerId: number
  customerName: string
  amount: number
  note: string
}

export type SaleLineDto = {
  name: string
  quantity: number
  price: number
}

export type SaleWithLinesDto = {
  id: number
  customerId: number | null
  customerName: string | null
  employeeId: number
  employeeName: string
  saleDate: string
  totalAmount: number
  paymentMethod: string
  items: SaleLineDto[]
}

export type AbonoDto = {
  id: number
  customerId: number
  customerName: string
  amount: number
  note: string
  paidAt: string
  createdAt: string
}

export type SalesHistoryResponse = {
  sales: SaleWithLinesDto[]
  abonos: AbonoDto[]
}

export function mapPaymentMethodFromApi(pm: string): SaleRecord["paymentMethod"] {
  const x = (pm || "").toLowerCase()
  if (x === "card") return "tarjeta"
  if (x === "credit") return "fiado"
  return "efectivo"
}

export function mapApiSaleToSaleRecord(s: SaleWithLinesDto): SaleRecord {
  const ts = new Date(s.saleDate)
  return {
    id: s.id,
    timestamp: ts,
    customer:
      s.customerName && s.customerName.trim() !== ""
        ? s.customerName.trim()
        : "Cliente general",
    customerId: s.customerId ?? null,
    items: (s.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    total: s.totalAmount,
    paymentMethod: mapPaymentMethodFromApi(s.paymentMethod),
    employeeId: s.employeeId,
  }
}

export function mapApiAbonoToEntry(a: AbonoDto): AbonoEntry {
  return {
    id: String(a.id),
    timestamp: new Date(a.paidAt),
    customerId: a.customerId,
    customerName: a.customerName,
    amount: a.amount,
    note: (a.note ?? "").trim(),
  }
}

export async function fetchSalesHistory(
  dateStart: string,
  dateEnd: string,
): Promise<SalesHistoryResponse> {
  const qs = new URLSearchParams({ dateStart, dateEnd })
  const res = await fetch(`${API_BASE}/sales/history?${qs.toString()}`)
  const json = (await res.json()) as {
    message?: string
    data?: SalesHistoryResponse
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo cargar el historial de ventas.")
  }
  return json.data ?? { sales: [], abonos: [] }
}

export type CreateSalePayload = {
  employeeId: number
  customerId?: number | null
  products: { productId: number; quantity: number; unitPrice?: number }[]
  total: number
  paymentMethod: "efectivo" | "tarjeta" | "fiado"
}

export type CreateSaleResult = {
  saleId: number
  totalAmount: number
}

export async function createSaleApi(
  payload: CreateSalePayload,
): Promise<CreateSaleResult> {
  const res = await fetch(`${API_BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: payload.employeeId,
      customerId: payload.customerId ?? null,
      products: payload.products,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
    }),
  })
  const json = (await res.json().catch(() => ({}))) as {
    message?: string
    detail?: string
    data?: { saleId?: number; totalAmount?: number }
  }
  if (!res.ok) {
    const base = json.message ?? "No se pudo registrar la venta."
    const extra =
      json.detail && json.detail !== base ? ` — ${json.detail}` : ""
    throw new Error(base + extra)
  }
  const saleId = json.data?.saleId
  const totalAmount = json.data?.totalAmount
  if (saleId == null || !Number.isFinite(Number(saleId))) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return {
    saleId: Number(saleId),
    totalAmount: totalAmount != null ? Number(totalAmount) : payload.total,
  }
}
