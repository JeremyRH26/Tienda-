import { API_BASE } from "@/lib/api-config"
import type { PendingCreditLine, ShopCustomer } from "@/lib/mock-data"
import { toSqlDateString } from "@/lib/sales-period"
import type { AbonoEntry } from "@/lib/services/sales.service"
import { mapApiAbonoToEntry } from "@/lib/services/sales.service"

export type CustomerDto = {
  id: number
  fullName: string
  phone: string
  email: string
  createdAt: string
  updatedAt: string
  balanceDue: number
}

export type CreditSaleDto = {
  saleId: number
  saleDate: string
  /** Total original de la factura a crédito. */
  totalAmount: number
  /** Saldo restante de esta factura tras aplicar abonos (FIFO por fecha). */
  balanceRemaining?: number
  items: { name: string; quantity: number; price: number }[]
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function mapCustomerDtoToShopCustomer(
  c: CustomerDto,
  creditLines: PendingCreditLine[],
): ShopCustomer {
  return {
    id: c.id,
    name: c.fullName,
    phone: c.phone || "-",
    email: c.email || "-",
    balance: Math.round((c.balanceDue ?? 0) * 100) / 100,
    lastPurchase: "-",
    totalPurchases: 0,
    pendingCreditLines: creditLines,
  }
}

export function mapCreditSalesToPendingLines(sales: CreditSaleDto[]): PendingCreditLine[] {
  return sales.map((s) => {
    const pendiente =
      s.balanceRemaining != null && Number.isFinite(s.balanceRemaining)
        ? s.balanceRemaining
        : s.totalAmount
    return {
      id: `sale-${s.saleId}`,
      fecha: formatShortDate(s.saleDate),
      descripcion: "Venta al fiado",
      totalOriginal: s.totalAmount,
      saldoPendiente: Math.round(pendiente * 100) / 100,
      items: s.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    }
  })
}

export async function fetchCustomersWithBalance(): Promise<CustomerDto[]> {
  const res = await fetch(`${API_BASE}/customers`)
  const json = (await res.json()) as { message?: string; data?: CustomerDto[] }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los clientes.")
  }
  return json.data ?? []
}

export async function fetchCustomerCreditSales(
  customerId: number,
): Promise<CreditSaleDto[]> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/credit-sales`)
  const json = (await res.json()) as {
    message?: string
    data?: {
      saleId: number
      saleDate: string
      totalAmount: number
      balanceRemaining?: number
      items: { name: string; quantity: number; price: number }[]
    }[]
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar las ventas a crédito.")
  }
  const rows = json.data ?? []
  return rows.map((r) => ({
    saleId: r.saleId,
    saleDate: r.saleDate,
    totalAmount: r.totalAmount,
    balanceRemaining: r.balanceRemaining,
    items: r.items ?? [],
  }))
}

export async function createCustomerApi(payload: {
  fullName: string
  phone: string
  email?: string
}): Promise<CustomerDto> {
  const res = await fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() ?? "",
    }),
  })
  const json = (await res.json()) as { message?: string; data?: CustomerDto }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo crear el cliente.")
  }
  if (!json.data?.id) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function deleteCustomerApi(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/customers/${id}`, { method: "DELETE" })
  const json = (await res.json().catch(() => ({}))) as {
    message?: string
    detail?: string
  }
  if (!res.ok) {
    const base = json.message ?? "No se pudo eliminar el cliente."
    const extra =
      json.detail && json.detail !== base ? ` — ${json.detail}` : ""
    throw new Error(base + extra)
  }
}

export async function updateCustomerApi(
  id: number,
  payload: { fullName: string; phone: string; email?: string },
): Promise<CustomerDto> {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() ?? "",
    }),
  })
  const json = (await res.json()) as { message?: string; data?: CustomerDto }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo actualizar el cliente.")
  }
  if (!json.data?.id) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return json.data
}

export async function createCustomerAbonoApi(
  customerId: number,
  payload: { amount: number; note?: string },
): Promise<{ customerAccountId: number }> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/abonos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      note: payload.note?.trim() ?? "",
    }),
  })
  const json = (await res.json()) as {
    message?: string
    data?: { customerAccountId?: number }
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudo registrar el abono.")
  }
  const aid = json.data?.customerAccountId
  if (aid == null || !Number.isFinite(Number(aid))) {
    throw new Error("Respuesta inválida del servidor.")
  }
  return { customerAccountId: Number(aid) }
}

/** Abonos en un rango (para hidratar el contexto de negocio). */
export async function fetchCustomerAbonosRange(
  dateStart: string,
  dateEnd: string,
): Promise<AbonoEntry[]> {
  const qs = new URLSearchParams({ dateStart, dateEnd })
  const res = await fetch(`${API_BASE}/customers/abonos?${qs.toString()}`)
  const json = (await res.json()) as {
    message?: string
    data?: import("@/lib/services/sales.service").AbonoDto[]
  }
  if (!res.ok) {
    throw new Error(json.message ?? "No se pudieron cargar los abonos.")
  }
  const rows = json.data ?? []
  return rows.map(mapApiAbonoToEntry)
}

/** Rango por defecto: últimos 12 meses hasta hoy. */
export function defaultAbonoFetchRange(): { dateStart: string; dateEnd: string } {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 12)
  return { dateStart: toSqlDateString(start), dateEnd: toSqlDateString(end) }
}
