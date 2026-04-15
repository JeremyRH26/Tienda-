"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  ShoppingCart,
  Receipt,
  Clock,
  Eye,
  CalendarDays,
  FileDown,
  Landmark,
  Coins,
  TrendingUp,
  Scale,
  Pencil,
  Users,
  Package,
} from "lucide-react"
import { mockProducts, type SaleRecord } from "@/lib/mock-data"
import {
  fetchInventoryProducts,
  type InventoryProductDto,
} from "@/lib/services/inventory.service"
import { formatQ, isSameCalendarDay } from "@/lib/currency"
import { useBusiness, type AbonoEntry } from "@/lib/business-context"
import { useAuth } from "@/lib/auth-context"
import {
  filterSalesByPeriod,
  formatSalesHistoryPeriodCaption,
  getSalesApiDateRange,
  type SalesPrintPeriod,
} from "@/lib/sales-period"
import {
  createSaleApi,
  deleteSaleApi,
  fetchPeriodFinancialBreakdown,
  fetchSalesHistory,
  mapApiAbonoToEntry,
  mapApiSaleToSaleRecord,
  updateSaleApi,
  type PeriodFinancialBreakdownDto,
} from "@/lib/services/sales.service"
import {
  fetchCustomersWithBalance,
  type CustomerDto,
} from "@/lib/services/customers.service"
import {
  aggregateProfitForSales,
  saleProfitBreakdown,
  type CatalogProduct,
} from "@/lib/sale-profit"
import { downloadSalesListPdf, downloadSaleReceiptPdf } from "@/lib/pdf-reports"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

/** Producto del POS: misma forma que el grid necesita (viene del inventario en API). */
type PosCatalogProduct = {
  id: number
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  image: string | null
}

function inventoryDtoToPosProduct(dto: InventoryProductDto): PosCatalogProduct {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.categoryName,
    costPrice: dto.costPrice,
    salePrice: dto.salePrice,
    stock: dto.quantity,
    image: dto.imageUrl,
  }
}

interface CartItem {
  product: PosCatalogProduct
  quantity: number
}

/** Líneas de una venta que no coinciden con un producto del catálogo (se conservan al editar). */
interface CustomCartLine {
  name: string
  quantity: number
  price: number
}

function matchCatalogProductByName(
  catalog: PosCatalogProduct[],
  itemName: string,
): PosCatalogProduct | undefined {
  const t = itemName.trim().toLowerCase()
  return catalog.find((p) => p.name.trim().toLowerCase() === t)
}

function buildReleasedQtyByProductId(
  sale: SaleRecord,
  catalog: PosCatalogProduct[],
): Record<number, number> {
  const out: Record<number, number> = {}
  for (const it of sale.items) {
    const p = matchCatalogProductByName(catalog, it.name)
    if (!p) continue
    out[p.id] = (out[p.id] ?? 0) + it.quantity
  }
  return out
}

function saleRecordToCart(
  sale: SaleRecord,
  catalog: PosCatalogProduct[],
): { cart: CartItem[]; customLines: CustomCartLine[] } {
  const customLines: CustomCartLine[] = []
  const byId = new Map<number, CartItem>()
  for (const it of sale.items) {
    const p = matchCatalogProductByName(catalog, it.name)
    if (p) {
      const prev = byId.get(p.id)
      if (prev) {
        byId.set(p.id, {
          product: { ...prev.product, salePrice: it.price },
          quantity: prev.quantity + it.quantity,
        })
      } else {
        byId.set(p.id, {
          product: { ...p, salePrice: it.price },
          quantity: it.quantity,
        })
      }
    } else {
      customLines.push({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
      })
    }
  }
  return { cart: Array.from(byId.values()), customLines }
}

function dateAtNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

function isPaidSale(s: SaleRecord): boolean {
  return s.paymentMethod === "efectivo" || s.paymentMethod === "tarjeta"
}

type HistoryRow =
  | { kind: "sale"; sale: SaleRecord }
  | { kind: "abono"; abono: AbonoEntry }

export function Ventas() {
  const { user, ready: authReady } = useAuth()
  const { abonos, mergeAbonosFromServer } = useBusiness()
  const [posProducts, setPosProducts] = useState<PosCatalogProduct[]>([])
  const [posLoadState, setPosLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  )
  const [posLoadError, setPosLoadError] = useState<string | null>(null)

  const loadPosCatalog = useCallback(async () => {
    setPosLoadState("loading")
    setPosLoadError(null)
    try {
      const rows = await fetchInventoryProducts(false)
      setPosProducts(rows.map(inventoryDtoToPosProduct))
      setPosLoadState("ready")
    } catch (e) {
      setPosLoadState("error")
      setPosLoadError(e instanceof Error ? e.message : "No se pudo cargar el inventario.")
    }
  }, [])

  useEffect(() => {
    void loadPosCatalog()
  }, [loadPosCatalog])

  useEffect(() => {
    let cancelled = false
    void fetchCustomersWithBalance()
      .then((rows) => {
        if (cancelled) return
        setPosCustomers(
          [...rows].sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
        )
      })
      .catch(() => {
        if (cancelled) return
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Costos para márgenes: inventario real + nombres del catálogo demo (historial mock). */
  const catalogForProfit = useMemo((): CatalogProduct[] => {
    const seen = new Set<string>()
    const out: CatalogProduct[] = []
    for (const p of posProducts) {
      const n = p.name.trim()
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({ name: p.name, costPrice: p.costPrice })
    }
    for (const p of mockProducts) {
      const n = p.name.trim()
      if (seen.has(n)) continue
      seen.add(n)
      out.push({ name: p.name, costPrice: p.costPrice })
    }
    return out
  }, [posProducts])

  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([])
  const [historyLoadState, setHistoryLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle")
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null)
  const [posCustomers, setPosCustomers] = useState<CustomerDto[]>([])
  const [posPaymentMethod, setPosPaymentMethod] = useState<
    "efectivo" | "tarjeta" | "fiado"
  >("efectivo")
  const [posFiadoCustomerId, setPosFiadoCustomerId] = useState<string>("")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [historyViewPeriod, setHistoryViewPeriod] =
    useState<SalesPrintPeriod>("day")
  const [historyRefDate, setHistoryRefDate] = useState(() => dateAtNoon(new Date()))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showBalanceOpen, setShowBalanceOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [showSaleDetail, setShowSaleDetail] = useState(false)
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null)
  const [editingStockBonus, setEditingStockBonus] = useState<Record<number, number>>(
    {},
  )
  const [salePendingDelete, setSalePendingDelete] = useState<SaleRecord | null>(null)
  const [deleteSaleInFlight, setDeleteSaleInFlight] = useState(false)
  const [selectedAbono, setSelectedAbono] = useState<AbonoEntry | null>(null)
  const [showAbonoDetail, setShowAbonoDetail] = useState(false)
  const [customLines, setCustomLines] = useState<CustomCartLine[]>([])
  const [activeTab, setActiveTab] = useState("pos")
  const [historyProductSearch, setHistoryProductSearch] = useState("")
  const [periodFinancials, setPeriodFinancials] =
    useState<PeriodFinancialBreakdownDto | null>(null)
  const [fiadoPickerOpen, setFiadoPickerOpen] = useState(false)
  const [fiadoCustomerSearch, setFiadoCustomerSearch] = useState("")

  const loadHistoryForPeriod = useCallback(async () => {
    setHistoryLoadState("loading")
    setHistoryLoadError(null)
    setPeriodFinancials(null)
    try {
      const { dateStart, dateEnd } = getSalesApiDateRange(
        historyViewPeriod,
        historyRefDate,
      )
      const bundle = await fetchSalesHistory(dateStart, dateEnd)
      setSalesHistory(bundle.sales.map(mapApiSaleToSaleRecord))
      mergeAbonosFromServer(bundle.abonos.map(mapApiAbonoToEntry))
      try {
        const fin = await fetchPeriodFinancialBreakdown(dateStart, dateEnd)
        setPeriodFinancials(fin)
      } catch {
        setPeriodFinancials(null)
      }
      setHistoryLoadState("ready")
    } catch (e) {
      setHistoryLoadState("error")
      setHistoryLoadError(
        e instanceof Error ? e.message : "No se pudo cargar el historial.",
      )
    }
  }, [historyViewPeriod, historyRefDate, mergeAbonosFromServer])

  useEffect(() => {
    void loadHistoryForPeriod()
  }, [loadHistoryForPeriod])

  const maxQtyForProduct = useCallback(
    (productId: number) => {
      const base = posProducts.find((p) => p.id === productId)?.stock ?? 0
      const bonus =
        editingSaleId != null ? editingStockBonus[productId] ?? 0 : 0
      return base + bonus
    },
    [posProducts, editingSaleId, editingStockBonus],
  )

  const cancelEditSale = useCallback(() => {
    setEditingSaleId(null)
    setEditingStockBonus({})
    setCart([])
    setCustomLines([])
    setPosFiadoCustomerId("")
    setPosPaymentMethod("efectivo")
  }, [])

  const beginEditSale = useCallback(
    (sale: SaleRecord) => {
      const { cart: nextCart, customLines: cl } = saleRecordToCart(sale, posProducts)
      setCart(nextCart)
      setCustomLines(cl)
      setPosPaymentMethod(sale.paymentMethod)
      setPosFiadoCustomerId(
        sale.paymentMethod === "fiado" &&
          sale.customerId != null &&
          sale.customerId > 0
          ? String(sale.customerId)
          : "",
      )
      setEditingSaleId(sale.id)
      setEditingStockBonus(buildReleasedQtyByProductId(sale, posProducts))
      setShowSaleDetail(false)
      setSelectedSale(null)
      setActiveTab("pos")
    },
    [posProducts],
  )

  const filteredProducts = posProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addToCart = (product: PosCatalogProduct) => {
    const cap = maxQtyForProduct(product.id)
    if (cap <= 0) return
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        const nextQty = existing.quantity + 1
        if (nextQty > cap) return prev
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty }
            : item,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    const cap = maxQtyForProduct(productId)
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item
          const next = Math.max(0, item.quantity + delta)
          const capped = Math.min(next, cap)
          return { ...item, quantity: capped }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const total = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + item.product.salePrice * item.quantity,
        0
      ) +
      customLines.reduce((acc, l) => acc + l.price * l.quantity, 0),
    [cart, customLines]
  )

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const now = new Date()
  const visibleSales = useMemo(
    () => filterSalesByPeriod(salesHistory, historyViewPeriod, historyRefDate),
    [salesHistory, historyViewPeriod, historyRefDate]
  )

  const visibleSalesPaid = useMemo(
    () => visibleSales.filter(isPaidSale),
    [visibleSales]
  )

  const visibleAbonos = useMemo(
    () => filterSalesByPeriod(abonos, historyViewPeriod, historyRefDate),
    [abonos, historyViewPeriod, historyRefDate]
  )

  const historyRows = useMemo((): HistoryRow[] => {
    const rows: HistoryRow[] = [
      ...visibleSales.map((sale) => ({ kind: "sale" as const, sale })),
      ...visibleAbonos.map((abono) => ({ kind: "abono" as const, abono })),
    ]
    rows.sort((a, b) => {
      const ta = a.kind === "sale" ? a.sale.timestamp : a.abono.timestamp
      const tb = b.kind === "sale" ? b.sale.timestamp : b.abono.timestamp
      return tb.getTime() - ta.getTime()
    })
    return rows
  }, [visibleSales, visibleAbonos])

  const filteredHistoryRows = useMemo(() => {
    const q = historyProductSearch.trim().toLowerCase()
    if (!q) return historyRows
    return historyRows.filter((row) => {
      if (row.kind === "sale") {
        return (
          row.sale.customer.toLowerCase().includes(q) ||
          row.sale.items.some((i) => i.name.toLowerCase().includes(q))
        )
      }
      const note = (row.abono.note ?? "").toLowerCase()
      return row.abono.customerName.toLowerCase().includes(q) || note.includes(q)
    })
  }, [historyRows, historyProductSearch])

  const periodRevenueTotal = useMemo(
    () => visibleSalesPaid.reduce((acc, sale) => acc + sale.total, 0),
    [visibleSalesPaid]
  )

  const periodProfitTotal = useMemo(
    () => aggregateProfitForSales(visibleSalesPaid, catalogForProfit).totalMargin,
    [visibleSalesPaid, catalogForProfit],
  )

  const balanceTotals = useMemo(
    () => aggregateProfitForSales(visibleSalesPaid, catalogForProfit),
    [visibleSalesPaid, catalogForProfit],
  )

  const visibleAbonosCashSum = useMemo(
    () => visibleAbonos.reduce((acc, a) => acc + a.amount, 0),
    [visibleAbonos],
  )

  const periodIngresoTotal = periodFinancials
    ? periodFinancials.totals.revenue
    : periodRevenueTotal + visibleAbonosCashSum
  const periodCapitalTotal = periodFinancials
    ? periodFinancials.totals.cost
    : balanceTotals.totalCost
  const periodGananciaTotal = periodFinancials
    ? periodFinancials.totals.margin
    : periodProfitTotal

  const fiadoPickerFiltered = useMemo(() => {
    const q = fiadoCustomerSearch.trim().toLowerCase()
    if (!q) return posCustomers
    return posCustomers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email || "").toLowerCase().includes(q),
    )
  }, [posCustomers, fiadoCustomerSearch])

  const fiadoSelectedLabel = useMemo(() => {
    if (!posFiadoCustomerId) return "Seleccionar cliente para fiado"
    const c = posCustomers.find((x) => String(x.id) === posFiadoCustomerId)
    return c?.fullName ?? "Cliente"
  }, [posFiadoCustomerId, posCustomers])

  const historyPeriodCaption = formatSalesHistoryPeriodCaption(
    historyViewPeriod,
    historyRefDate
  )

  const handleCheckout = async () => {
    if (!authReady || !user) {
      toast.error("Inicia sesión para cobrar.")
      return
    }
    if (cart.length === 0 && customLines.length === 0) {
      toast.error("Agrega productos al carrito.")
      return
    }
    if (customLines.length > 0) {
      toast.error(
        "Las líneas fuera de catálogo no se pueden registrar en el servidor.",
      )
      return
    }
    if (posPaymentMethod === "fiado") {
      const cid = Number(posFiadoCustomerId)
      if (!Number.isFinite(cid) || cid <= 0) {
        toast.error("Selecciona el cliente para el fiado.")
        return
      }
    }
    setCheckoutLoading(true)
    try {
      const products = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
      }))
      const payload = {
        employeeId: user.id,
        customerId:
          posPaymentMethod === "fiado" ? Number(posFiadoCustomerId) : null,
        products,
        total,
        paymentMethod: posPaymentMethod,
      }
      if (editingSaleId != null) {
        await updateSaleApi(editingSaleId, payload)
        toast.success("Venta actualizada.")
        setEditingSaleId(null)
        setEditingStockBonus({})
      } else {
        await createSaleApi(payload)
        toast.success("Venta registrada.")
      }
      setCart([])
      setCustomLines([])
      setPosFiadoCustomerId("")
      setPosPaymentMethod("efectivo")
      await loadPosCatalog()
      await loadHistoryForPeriod()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo registrar la venta.",
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleConfirmDeleteSale = async () => {
    const del = salePendingDelete
    if (!del) return
    setDeleteSaleInFlight(true)
    try {
      await deleteSaleApi(del.id)
      toast.success("Venta eliminada.")
      setSalePendingDelete(null)
      setShowSaleDetail(false)
      setSelectedSale(null)
      if (editingSaleId != null && editingSaleId === del.id) {
        cancelEditSale()
      }
      await loadPosCatalog()
      await loadHistoryForPeriod()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "No se pudo eliminar la venta.",
      )
    } finally {
      setDeleteSaleInFlight(false)
    }
  }

  const removeCustomLine = (index: number) => {
    setCustomLines((prev) => prev.filter((_, i) => i !== index))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDateTime = (date: Date) => {
    if (isSameCalendarDay(date, new Date())) return formatTime(date)
    return date.toLocaleString("es-GT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ventasHoy = salesHistory.filter((s) => isSameCalendarDay(s.timestamp, now))
  const recaudadoVentasHoy = ventasHoy
    .filter((s) => s.paymentMethod === "efectivo" || s.paymentMethod === "tarjeta")
    .reduce((acc, s) => acc + s.total, 0)
  const abonosRecibidosHoy = abonos
    .filter((a) => isSameCalendarDay(a.timestamp, now))
    .reduce((acc, a) => acc + a.amount, 0)

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "efectivo":
        return <Badge variant="outline" className="border-primary text-primary">Efectivo</Badge>
      case "tarjeta":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Tarjeta</Badge>
      case "fiado":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Fiado</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const CartContent = () => (
    <>
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 && customLines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Agrega productos al carrito
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                      {item.product.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatQ(item.product.salePrice)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.product.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium sm:w-8">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.product.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 sm:h-8 sm:w-8"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {customLines.map((line, idx) => (
              <div
                key={`custom-${idx}-${line.name}`}
                className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatQ(line.price)} c/u · fuera de catálogo
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">×{line.quantity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Quitar línea"
                  onClick={() => removeCustomLine(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pago y cobro */}
      <div className="border-t p-4 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Forma de pago</Label>
          <Select
            value={posPaymentMethod}
            onValueChange={(v) =>
              setPosPaymentMethod(v as "efectivo" | "tarjeta" | "fiado")
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="tarjeta">Tarjeta</SelectItem>
              <SelectItem value="fiado">Fiado / crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {posPaymentMethod === "fiado" ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between gap-2 px-3 font-normal"
              onClick={() => {
                setFiadoCustomerSearch("")
                setFiadoPickerOpen(true)
              }}
            >
              <span className="min-w-0 truncate text-left">{fiadoSelectedLabel}</span>
              <Users className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
            {posCustomers.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No hay clientes en el directorio. Créalos en el módulo Clientes.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary tabular-nums">
            {formatQ(total)}
          </span>
        </div>
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={
            checkoutLoading ||
            cart.length + customLines.length === 0 ||
            !authReady ||
            !user
          }
          onClick={() => void handleCheckout()}
        >
          {checkoutLoading
            ? editingSaleId != null
              ? "Guardando…"
              : "Registrando…"
            : editingSaleId != null
              ? "Guardar cambios"
              : "Cobrar"}
        </Button>
        {!user && authReady ? (
          <p className="text-center text-xs text-destructive">
            Inicia sesión para registrar ventas.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {editingSaleId != null
              ? "Al guardar se reemplazan las líneas de la venta y se ajusta el inventario."
              : "El inventario se actualiza al cobrar. Fiado exige cliente y descuenta stock."}
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Punto de Venta</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Catálogo desde inventario; las ventas se guardan en el servidor (efectivo, tarjeta o fiado).
            </p>
          </div>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="pos" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Venta</span>
              <span className="sm:hidden">POS</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Historial</span>
              <span className="sm:hidden">Ventas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pos" className="mt-4 space-y-3">
          {editingSaleId != null ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm">
              <span className="font-medium text-amber-950 dark:text-amber-100">
                Editando venta #{editingSaleId} — al guardar se actualizan líneas y totales; la fecha original de la venta se conserva en el servidor.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-600/50"
                onClick={() => cancelEditSale()}
              >
                Cancelar edición
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* Products Grid */}
            <div className="flex min-h-0 flex-1 flex-col space-y-4">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 text-base sm:h-12"
                  />
                </div>
                {/* Mobile Cart Button — badge dentro del botón para que no lo recorte overflow del layout */}
                <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-11 w-11 shrink-0 overflow-visible sm:h-12 sm:w-12 lg:hidden"
                    >
                      <ShoppingCart className="h-5 w-5 shrink-0" />
                      {cartItemCount > 0 && (
                        <span
                          className="absolute right-0.5 top-0.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold tabular-nums leading-none text-primary-foreground shadow-sm ring-2 ring-background"
                          aria-hidden
                        >
                          {cartItemCount > 99 ? "99+" : cartItemCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
                    <SheetHeader className="border-b p-4">
                      <SheetTitle className="flex items-center justify-between text-base">
                        <span>Carrito</span>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {cartItemCount} items
                        </span>
                      </SheetTitle>
                      <SheetDescription className="sr-only">Tu carrito de compras actual.</SheetDescription>
                    </SheetHeader>
                    <div className="flex min-h-0 flex-1 flex-col">
                      <CartContent />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Products */}
              <div className="min-h-0 flex-1 overflow-y-auto pb-4" style={{ maxHeight: "calc(100vh - 22rem)" }}>
                {posLoadState === "loading" ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Clock className="h-8 w-8 animate-pulse opacity-50" />
                    Cargando productos del inventario…
                  </div>
                ) : posLoadState === "error" ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                    <p className="text-destructive">{posLoadError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void loadPosCatalog()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No hay productos activos en inventario. Agrega productos en el módulo Inventario.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => {
                      const outOfStock = maxQtyForProduct(product.id) <= 0
                      return (
                        <Card
                          key={product.id}
                          role="button"
                          tabIndex={outOfStock ? -1 : 0}
                          aria-disabled={outOfStock}
                          className={`shadow-sm transition-all ${
                            outOfStock
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:shadow-md active:scale-[0.98]"
                          }`}
                          onClick={() => !outOfStock && addToCart(product)}
                          onKeyDown={(e) => {
                            if (outOfStock) return
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              addToCart(product)
                            }
                          }}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="mb-2 flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-muted sm:h-28">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <span className="text-xl font-bold text-muted-foreground sm:text-2xl">
                                  {product.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <h3 className="line-clamp-2 text-xs font-medium sm:text-sm">{product.name}</h3>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                            <div className="mt-2 flex items-center justify-between gap-1">
                              <span className="text-base font-bold text-primary sm:text-lg">
                                {formatQ(product.salePrice)}
                              </span>
                              <span
                                className={
                                  outOfStock ? "text-xs font-medium text-destructive" : "text-xs text-muted-foreground"
                                }
                              >
                                {outOfStock ? "Sin stock" : product.stock}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Cart Sidebar */}
            <Card className="hidden w-80 shrink-0 shadow-sm lg:flex lg:w-96 lg:flex-col" style={{ maxHeight: "calc(100vh - 14rem)" }}>
              <CardHeader className="shrink-0 border-b">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Carrito</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {cartItemCount} items
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="flex min-h-0 flex-1 flex-col">
                <CartContent />
              </div>
            </Card>

            {/* Mobile Floating Cart Button */}
            {cartItemCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
                <Button 
                  className="h-14 w-full gap-3 text-base shadow-lg" 
                  onClick={() => setMobileCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Ver Carrito ({cartItemCount})
                  <span className="ml-auto font-bold">{formatQ(total)}</span>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3">
            {historyLoadState === "loading" ? (
              <p className="text-sm text-muted-foreground">Cargando historial…</p>
            ) : null}
            {historyLoadState === "error" && historyLoadError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {historyLoadError}
              </div>
            ) : null}
            <p className="text-sm font-medium text-foreground">{historyPeriodCaption}</p>
            <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "day" as const, label: "Día" },
                    { id: "week" as const, label: "Semana" },
                    { id: "month" as const, label: "Mes" },
                    { id: "year" as const, label: "Año" },
                  ] as const
                ).map(({ id, label }) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={historyViewPeriod === id ? "default" : "outline"}
                    onClick={() => setHistoryViewPeriod(id)}
                  >
                    {label}
                  </Button>
                ))}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Calendario
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={historyRefDate}
                      onSelect={(d) => {
                        if (d) {
                          setHistoryRefDate(dateAtNoon(d))
                          setCalendarOpen(false)
                        }
                      }}
                      defaultMonth={historyRefDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowBalanceOpen(true)}
                >
                  <Scale className="h-4 w-4" />
                  Balance
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    void downloadSalesListPdf(
                      visibleSales,
                      historyViewPeriod,
                      historyRefDate,
                      catalogForProfit,
                    )
                  }}
                >
                  <FileDown className="h-4 w-4" />
                  Generar PDF ventas
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 sm:gap-4">
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <Receipt className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Mov. ventas (periodo)
                  </p>
                  <p className="text-lg font-bold sm:text-2xl">{visibleSales.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <Banknote className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Ingreso total (periodo)
                  </p>
                  <p className="text-lg font-bold text-primary sm:text-2xl">
                    {formatQ(periodIngresoTotal)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                    Ventas cobradas + abonos del periodo
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-12 sm:w-12">
                  <Package className="h-5 w-5 text-muted-foreground sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Capital / costo (periodo)
                  </p>
                  <p className="text-lg font-bold text-foreground sm:text-2xl">
                    {formatQ(periodCapitalTotal)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                    Costo inventario (contado + parte de abonos FIFO)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Ganancia (periodo)
                  </p>
                  <p className="text-lg font-bold text-emerald-600 sm:text-2xl">
                    {formatQ(periodGananciaTotal)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                    Margen ventas cobradas + margen en abonos (FIFO)
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-12 sm:w-12">
                  <Landmark className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    Cobrado ventas (hoy)
                  </p>
                  <p className="text-lg font-bold text-primary sm:text-2xl">
                    {formatQ(recaudadoVentasHoy)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 sm:h-12 sm:w-12">
                  <Coins className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">Abonos (hoy)</p>
                  <p className="text-lg font-bold text-emerald-600 sm:text-2xl">
                    {formatQ(abonosRecibidosHoy)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          {historyLoadState === "ready" && !periodFinancials ? (
            <p className="text-xs text-muted-foreground">
              El desglose con abonos (FIFO) no está disponible; los totales del periodo suman abonos
              localmente sin reparto contra facturas al fiado.
            </p>
          ) : null}

          <Card className="shadow-sm">
            <CardHeader className="space-y-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                <Clock className="h-4 w-4" />
                Historial de ventas
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={historyProductSearch}
                  onChange={(e) => setHistoryProductSearch(e.target.value)}
                  placeholder="Producto, cliente o comentario de abono…"
                  className="h-10 pl-9"
                  aria-label="Buscar producto en historial"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {visibleSales.length === 0 && visibleAbonos.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No hay movimientos en el periodo seleccionado.
                  </p>
                ) : filteredHistoryRows.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Ningún resultado coincide con tu búsqueda.
                  </p>
                ) : (
                  filteredHistoryRows.map((row) =>
                    row.kind === "sale" ? (
                      <div
                        key={`sale-${row.sale.id}`}
                        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50 sm:gap-4"
                        onClick={() => {
                          setSelectedSale(row.sale)
                          setShowSaleDetail(true)
                        }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                          <Receipt className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium sm:text-base">
                              {row.sale.customer}
                            </p>
                            {getPaymentBadge(row.sale.paymentMethod)}
                          </div>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {row.sale.items.length} producto{row.sale.items.length > 1 ? "s" : ""} ·{" "}
                            {formatDateTime(row.sale.timestamp)}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-bold text-primary sm:text-lg">
                          {formatQ(row.sale.total)}
                        </p>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            aria-label="Ver detalle"
                            onClick={() => {
                              setSelectedSale(row.sale)
                              setShowSaleDetail(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`abono-${row.abono.id}`}
                        className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/50 sm:gap-4"
                        onClick={() => {
                          setSelectedAbono(row.abono)
                          setShowAbonoDetail(true)
                        }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 sm:h-12 sm:w-12">
                          <Coins className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium sm:text-base">
                              {row.abono.customerName}
                            </p>
                            <Badge
                              variant="outline"
                              className="border-emerald-600 text-emerald-700 dark:text-emerald-400"
                            >
                              Abono
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                            Cobro a cuenta (abono) · suma al ingreso del día y se reparte FIFO contra
                            facturas al fiado (capital y ganancia en Balance).
                            {row.abono.note ? ` · ${row.abono.note}` : ""}
                            <span className="block text-[11px] opacity-90">
                              {formatDateTime(row.abono.timestamp)}
                            </span>
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-bold text-emerald-600 sm:text-lg">
                          {formatQ(row.abono.amount)}
                        </p>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            aria-label="Ver detalle del abono"
                            onClick={() => {
                              setSelectedAbono(row.abono)
                              setShowAbonoDetail(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBalanceOpen} onOpenChange={setShowBalanceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Balance</DialogTitle>
            <DialogDescription>
              Ingreso del periodo = ventas cobradas (efectivo/tarjeta) más abonos registrados en las
              mismas fechas. Los abonos se reparten en orden FIFO contra facturas al fiado para separar
              capital (costo de mercancía) y ganancia.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium text-foreground">{historyPeriodCaption}</p>
            {periodFinancials ? (
              <>
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ventas cobradas (efectivo / tarjeta)
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad</span>
                    <span className="font-medium tabular-nums">
                      {periodFinancials.paidSales.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingreso</span>
                    <span className="font-medium tabular-nums">
                      {formatQ(periodFinancials.paidSales.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capital (costo)</span>
                    <span className="font-medium tabular-nums">
                      {formatQ(periodFinancials.paidSales.cost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia</span>
                    <span className="font-medium tabular-nums text-emerald-600">
                      {formatQ(periodFinancials.paidSales.margin)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                    Abonos del periodo (cobro a cuenta)
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagos registrados</span>
                    <span className="font-medium tabular-nums">
                      {periodFinancials.abonosInPeriod.count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Efectivo cobrado</span>
                    <span className="font-medium tabular-nums">
                      {formatQ(periodFinancials.abonosInPeriod.cash)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capital recuperado</span>
                    <span className="font-medium tabular-nums">
                      {formatQ(periodFinancials.abonosInPeriod.costRecovery)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia recuperada</span>
                    <span className="font-medium tabular-nums text-emerald-600">
                      {formatQ(periodFinancials.abonosInPeriod.marginRecovery)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total periodo (ventas cobradas + abonos)
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingreso total</span>
                    <span className="font-semibold tabular-nums">
                      {formatQ(periodFinancials.totals.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capital total</span>
                    <span className="font-semibold tabular-nums">
                      {formatQ(periodFinancials.totals.cost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Ganancia total</span>
                    <span className="text-emerald-600 tabular-nums">
                      {formatQ(periodFinancials.totals.margin)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar el desglose con abonos. Mostrando solo ventas cobradas del periodo
                  (sin reparto FIFO de abonos).
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ventas cobradas</span>
                  <span className="font-medium tabular-nums">{visibleSalesPaid.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingresos</span>
                  <span className="font-medium tabular-nums">
                    {formatQ(balanceTotals.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio costo total</span>
                  <span className="font-medium tabular-nums">
                    {formatQ(balanceTotals.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <span>Ganancia generada</span>
                  <span className="text-emerald-600 tabular-nums">
                    {formatQ(balanceTotals.totalMargin)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={fiadoPickerOpen}
        onOpenChange={(open) => {
          setFiadoPickerOpen(open)
          if (!open) setFiadoCustomerSearch("")
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,520px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 border-b px-6 pb-3 pt-6">
            <DialogTitle>Cliente para fiado</DialogTitle>
            <DialogDescription>
              Busca por nombre, teléfono o correo y toca un cliente para asignar el crédito.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={fiadoCustomerSearch}
                onChange={(e) => setFiadoCustomerSearch(e.target.value)}
                placeholder="Buscar cliente…"
                className="h-10 pl-9"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[min(22rem,48vh)] rounded-md border sm:h-[min(24rem,50vh)]">
              <div className="divide-y p-1">
                {fiadoPickerFiltered.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    {posCustomers.length === 0
                      ? "No hay clientes. Créalos en el módulo Clientes."
                      : "Ningún cliente coincide con la búsqueda."}
                  </p>
                ) : (
                  fiadoPickerFiltered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-3 text-left text-sm transition-colors hover:bg-muted"
                      onClick={() => {
                        setPosFiadoCustomerId(String(c.id))
                        setFiadoPickerOpen(false)
                        setFiadoCustomerSearch("")
                      }}
                    >
                      <span className="font-medium">{c.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.phone}
                        {c.email ? ` · ${c.email}` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Detail Dialog */}
      <Dialog open={showSaleDetail} onOpenChange={setShowSaleDetail}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
            <DialogDescription className="sr-only">Detalle de venta</DialogDescription>
          </DialogHeader>
          {selectedSale &&
            (() => {
              const pb = saleProfitBreakdown(selectedSale, catalogForProfit)
              const isFiado = selectedSale.paymentMethod === "fiado"
              const fechaStr = selectedSale.timestamp.toLocaleDateString("es-GT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
              const horaStr = selectedSale.timestamp.toLocaleTimeString("es-GT", {
                hour: "2-digit",
                minute: "2-digit",
              })
              return (
                <div className="space-y-4 py-4">
                  <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Venta</span>
                      <span className="font-medium">#{selectedSale.id}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="text-right font-medium">{fechaStr}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Hora</span>
                      <span className="font-medium">{horaStr}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Total productos vendidos</span>
                      <span className="font-medium tabular-nums">{pb.totalUnits} uds</span>
                    </div>
                    <div className="flex justify-between gap-2 border-t pt-2">
                      <span className="text-muted-foreground">Ganancia de la venta</span>
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {formatQ(pb.totalMargin)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">{selectedSale.customer}</p>
                    <div className="mt-1">{getPaymentBadge(selectedSale.paymentMethod)}</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Productos</p>
                    {pb.lines.map((line, index) => (
                      <div
                        key={`${line.name}-${index}`}
                        className="rounded-lg bg-muted/50 p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{line.name}</p>
                          <p className="shrink-0 font-medium tabular-nums">
                            {formatQ(line.lineRevenue)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatQ(line.price)} × {line.quantity}
                        </p>
                        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                          Ganancia: {formatQ(line.lineMargin)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                    <span className="font-medium">
                      {isFiado ? "Total fiado" : "Total cobrado"}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatQ(selectedSale.total)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2"
                    onClick={() => void downloadSaleReceiptPdf(selectedSale)}
                  >
                    <FileDown className="h-4 w-4" />
                    Generar PDF recibo
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 gap-2"
                      onClick={() => beginEditSale(selectedSale)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                      onClick={() => setSalePendingDelete(selectedSale)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={salePendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteSaleInFlight) setSalePendingDelete(null)
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se anulará la venta #{salePendingDelete?.id}, se restaurará el stock de los productos y
              desaparecerá del historial. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaleInFlight}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSaleInFlight}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDeleteSale()
              }}
            >
              {deleteSaleInFlight ? "Eliminando…" : "Eliminar venta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={showAbonoDetail}
        onOpenChange={(open) => {
          setShowAbonoDetail(open)
          if (!open) setSelectedAbono(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abono</DialogTitle>
            <DialogDescription className="sr-only">Detalle de abono</DialogDescription>
          </DialogHeader>
          {selectedAbono && (
            <div className="space-y-3 py-2">
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="text-right font-medium">{selectedAbono.customerName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Fecha y hora</span>
                  <span className="text-right font-medium">
                    {selectedAbono.timestamp.toLocaleString("es-GT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-t pt-2">
                  <span className="text-muted-foreground">Monto</span>
                  <span className="text-lg font-bold text-emerald-600 tabular-nums">
                    {formatQ(selectedAbono.amount)}
                  </span>
                </div>
              </div>
              {selectedAbono.note ? (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Comentario</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedAbono.note}</p>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
