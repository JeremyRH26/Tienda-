"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Wallet,
  AlertCircle,
  LayoutDashboard,
  RefreshCw,
  CalendarRange,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatQ, formatQChartTick } from "@/lib/currency"
import { useBusiness } from "@/lib/business-context"
import { startOfWeekMonday } from "@/lib/sales-period"
import {
  fetchDashboardSummary,
  type DashboardActivityItem,
  type DashboardSummaryDto,
} from "@/lib/services/dashboard.service"
import { Spinner } from "@/components/ui/spinner"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime())
  x.setDate(x.getDate() + n)
  return x
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseLocalYmd(ymd: string): Date {
  const parts = ymd.split("-").map((x) => parseInt(x, 10))
  const y = parts[0] ?? 1970
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

const CHART_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const

function buildEmptySummary(): DashboardSummaryDto {
  const ws = startOfWeekMonday(new Date())
  const we = addDays(ws, 6)
  return {
    weekStart: ymdLocal(ws),
    weekEnd: ymdLocal(we),
    salesWeekTotal: 0,
    salesPrevWeekTotal: 0,
    weekOverWeekPct: null,
    salesChart: CHART_DAYS.map((day) => ({ day, sales: 0 })),
    receivableTotal: 0,
    receivableCustomersCount: 0,
    lowStock: [],
    activity: [],
  }
}

function formatWeekRangeCaption(weekStart: string, weekEnd: string): string {
  if (!weekStart || !weekEnd) return ""
  const a = parseLocalYmd(weekStart)
  const b = parseLocalYmd(weekEnd)
  const left = a.toLocaleDateString("es-GT", { day: "numeric", month: "short" })
  const right = b.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${left} – ${right}`
}

function activityPrimaryText(item: DashboardActivityItem): string {
  if (item.type === "sale") {
    return `Venta (${item.paymentLabel}) · ${formatQ(item.amount)} — ${item.detail}`
  }
  const note = item.note.trim()
  const base = `Gasto · ${item.detail} — ${formatQ(item.amount)}`
  return note ? `${base} (${note.length > 48 ? `${note.slice(0, 48)}…` : note})` : base
}

export function Dashboard() {
  const { expenses } = useBusiness()
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null)
  const [booting, setBooting] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent)
    if (silent) {
      setRefreshing(true)
    }
    try {
      const data = await fetchDashboardSummary()
      setSummary(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el dashboard")
    } finally {
      setBooting(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const { totalExpensesMonth, expensesMonthCount, monthLabel } = useMemo(() => {
    const now = new Date()
    const inMonth = expenses.filter((e) => sameCalendarMonth(e.date, now))
    const total = inMonth.reduce((acc, e) => acc + e.amount, 0)
    const label = now.toLocaleDateString("es-GT", {
      month: "long",
      year: "numeric",
    })
    return {
      totalExpensesMonth: total,
      expensesMonthCount: inMonth.length,
      monthLabel: label,
    }
  }, [expenses])

  const emptySummaryFallback = useMemo(() => buildEmptySummary(), [])
  const data = summary ?? emptySummaryFallback
  const salesWeekTotal = data.salesWeekTotal
  const balance = salesWeekTotal - totalExpensesMonth
  const weekCaption = formatWeekRangeCaption(data.weekStart, data.weekEnd)

  const trendBlock = useMemo(() => {
    const pct = data.weekOverWeekPct
    if (pct != null && Number.isFinite(pct)) {
      const up = pct >= 0
      return (
        <p
          className={`flex items-center gap-1 text-xs ${up ? "text-primary" : "text-destructive"}`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="hidden sm:inline">
            {up ? "+" : ""}
            {pct}% vs semana anterior
          </span>
          <span className="sm:hidden">
            {up ? "+" : ""}
            {pct}%
          </span>
        </p>
      )
    }
    if (salesWeekTotal > 0.005) {
      return (
        <p className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Sin ventas registradas la semana anterior</span>
          <span className="sm:hidden">Sin base previa</span>
        </p>
      )
    }
    return (
      <p className="text-xs text-muted-foreground">
        {salesWeekTotal <= 0.005 ? "Sin ventas esta semana" : "Ventas de la semana en curso"}
      </p>
    )
  }, [data.weekOverWeekPct, salesWeekTotal])

  const chartData = data.salesChart?.length ? data.salesChart : []
  const chartHasSales = chartData.some((p) => p.sales > 0.0001)
  const lowStock = data.lowStock ?? []
  const activity = data.activity ?? []
  const receivableTotal = data.receivableTotal
  const receivableCustomersCount = data.receivableCustomersCount

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/30 px-4 py-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.06] blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3.5 sm:gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-inner sm:h-14 sm:w-14 sm:rounded-2xl"
              aria-hidden
            >
              <LayoutDashboard className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Dashboard
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Resumen de ventas, gastos y alertas de stock
              </p>
              {weekCaption ? (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm sm:px-3 sm:text-sm">
                    <CalendarRange className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="text-muted-foreground">Semana</span>
                    <span className="text-foreground/90">{weekCaption}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={refreshing || booting}
            onClick={() => void load({ silent: true })}
            className="h-10 w-full shrink-0 gap-2 border-primary/25 bg-background/80 text-primary shadow-sm hover:bg-primary/5 hover:text-primary sm:h-11 sm:w-auto sm:self-center sm:px-5"
          >
            <RefreshCw className={cn("h-4 w-4 shrink-0", refreshing && "animate-spin")} aria-hidden />
            <span className="sm:hidden">Actualizar</span>
            <span className="hidden sm:inline">Actualizar datos</span>
          </Button>
        </div>
      </header>

      {booting && summary == null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : null}

      <div className={`space-y-6 ${booting && summary == null ? "hidden" : ""}`}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Ventas semana
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold sm:text-2xl">{formatQ(salesWeekTotal)}</div>
              {trendBlock}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Gastos del mes
              </CardTitle>
              <Wallet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold sm:text-2xl">{formatQ(totalExpensesMonth)}</div>
              <p className="text-xs text-muted-foreground">
                {expensesMonthCount === 0
                  ? `Sin gastos registrados en ${monthLabel}`
                  : `${expensesMonthCount} registro${expensesMonthCount === 1 ? "" : "s"} en ${monthLabel}`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold text-primary sm:text-2xl">{formatQ(balance)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">
                  Ventas de la semana - Gastos del mes
                </span>
                <span className="sm:hidden">Ventas semana − gastos mes</span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Por cobrar
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg font-bold text-amber-600 sm:text-2xl">
                {formatQ(receivableTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {receivableCustomersCount} cliente{receivableCustomersCount === 1 ? "" : "s"} con
                ventas a fiado
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                Suma de ventas en fiado
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold sm:text-base">
                Ventas de la semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 sm:h-72">
                {!chartHasSales ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Sin ventas en esta semana
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => formatQChartTick(Number(value))}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatQ(value), "Ventas"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="hsl(160, 84%, 39%)"
                        strokeWidth={2}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay productos con stock bajo</p>
                ) : (
                  lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{product.quantity} uds</p>
                        <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold sm:text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos recientes en la base de datos</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item, index) => {
                  const at = Date.parse(item.occurredAt)
                  const when =
                    Number.isFinite(at) && at > 0
                      ? formatDistanceToNow(new Date(at), { addSuffix: true, locale: es })
                      : ""
                  return (
                    <div key={`${item.type}-${item.occurredAt}-${index}`} className="flex items-center gap-4">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          item.type === "sale"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {item.type === "sale" ? (
                          <ShoppingBag className="h-4 w-4" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{activityPrimaryText(item)}</p>
                        <p className="text-xs text-muted-foreground">{when}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
