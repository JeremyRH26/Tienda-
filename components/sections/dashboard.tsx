"use client"

import { useMemo } from "react"
import { endOfWeek, isWithinInterval, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, DollarSign, ShoppingBag, Wallet, AlertCircle } from "lucide-react"
import { mockSalesData, mockProducts, mockCustomers } from "@/lib/mock-data"
import { formatQ, formatQChartTick } from "@/lib/currency"
import { useBusiness } from "@/lib/business-context"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

export function Dashboard() {
  const { expenses } = useBusiness()
  const totalSales = mockSalesData.reduce((acc, day) => acc + day.sales, 0)

  const { totalExpensesWeek, expensesWeekCount } = useMemo(() => {
    const ref = new Date()
    const weekStartsOn = 1 as const
    const start = startOfWeek(ref, { weekStartsOn })
    const end = endOfWeek(ref, { weekStartsOn })
    const inWeek = expenses.filter((e) =>
      isWithinInterval(e.date, { start, end })
    )
    const total = inWeek.reduce((acc, e) => acc + e.amount, 0)
    return { totalExpensesWeek: total, expensesWeekCount: inWeek.length }
  }, [expenses])

  const balance = totalSales - totalExpensesWeek
  const totalDebt = mockCustomers.reduce((acc, c) => acc + c.balance, 0)
  const lowStockProducts = mockProducts.filter(p => p.stock < p.minStock)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Resumen de tu negocio esta semana</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Ventas Semana
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold sm:text-2xl">{formatQ(totalSales)}</div>
            <p className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">+12.5% vs semana anterior</span>
              <span className="sm:hidden">+12.5%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Gastos Semana
            </CardTitle>
            <Wallet className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold sm:text-2xl">{formatQ(totalExpensesWeek)}</div>
            <p className="text-xs text-muted-foreground">
              {expensesWeekCount === 0
                ? "Sin registros en Gastos esta semana"
                : `${expensesWeekCount} registro${expensesWeekCount === 1 ? "" : "s"} · módulo Gastos`}
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
                Ventas de la semana 
              </span>
              <span className="sm:hidden">Ganancia neta semanal</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Por Cobrar
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-bold text-amber-600 sm:text-2xl">{formatQ(totalDebt)}</div>
            <p className="text-xs text-muted-foreground">
              {mockCustomers.filter(c => c.balance > 0).length} clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold sm:text-base">Ventas de la Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockSalesData}>
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
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => formatQChartTick(Number(value))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
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
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold sm:text-base">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos con stock bajo</p>
              ) : (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-900/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">{product.stock} uds</p>
                      <p className="text-xs text-muted-foreground">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold sm:text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: "sale", text: `Venta de ${formatQ(450)} - María García`, time: "Hace 5 min" },
              { type: "payment", text: `Abono recibido de Ana Martínez - ${formatQ(500)}`, time: "Hace 15 min" },
              { type: "stock", text: "Reposición de inventario - Coca-Cola 600ml", time: "Hace 1 hora" },
              { type: "sale", text: `Venta de ${formatQ(280)} - Cliente general`, time: "Hace 2 horas" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  activity.type === 'sale' ? 'bg-primary/10 text-primary' :
                  activity.type === 'payment' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                }`}>
                  {activity.type === 'sale' ? <ShoppingBag className="h-4 w-4" /> :
                   activity.type === 'payment' ? <DollarSign className="h-4 w-4" /> :
                   <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
