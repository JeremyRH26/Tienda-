"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import {
  mockSalesData,
  mockMonthlySales,
  mockDailySalesHours,
  mockYearlySales,
} from "@/lib/mock-data"
import { formatQ, formatQChartTick } from "@/lib/currency"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

type ReportPeriod = "diario" | "semanal" | "mensual" | "anual"

type ChartRow = { label: string; sales: number; expenses: number }

export function Reportes() {
  const [period, setPeriod] = useState<ReportPeriod>("semanal")

  const chartRows: ChartRow[] = useMemo(() => {
    switch (period) {
      case "diario":
        return mockDailySalesHours.map((r) => ({
          label: r.hour,
          sales: r.sales,
          expenses: r.expenses,
        }))
      case "semanal":
        return mockSalesData.map((r) => ({
          label: r.day,
          sales: r.sales,
          expenses: r.expenses,
        }))
      case "mensual":
        return mockMonthlySales.map((r) => ({
          label: r.month,
          sales: r.sales,
          expenses: r.expenses,
        }))
      case "anual":
        return mockYearlySales.map((r) => ({
          label: r.year,
          sales: r.sales,
          expenses: r.expenses,
        }))
      default:
        return []
    }
  }, [period])

  const currentTotal = chartRows.reduce((acc, r) => acc + r.sales, 0)
  const currentExpenses = chartRows.reduce((acc, r) => acc + r.expenses, 0)
  const currentProfit = currentTotal - currentExpenses

  const periodLabels = {
    diario: {
      ventas: "del día (por hora)",
      gastos: "del día (por hora)",
      desglose: "por hora",
      columna: "Hora",
    },
    semanal: {
      ventas: "semanales",
      gastos: "semanales",
      desglose: "diario",
      columna: "Día",
    },
    mensual: {
      ventas: "del semestre",
      gastos: "del semestre",
      desglose: "mensual",
      columna: "Mes",
    },
    anual: {
      ventas: "anuales",
      gastos: "anuales",
      desglose: "por año",
      columna: "Año",
    },
  } as const

  const pl = periodLabels[period]

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Reportes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Analiza el rendimiento de tu negocio por día, semana, mes o año
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button
            variant={period === "diario" ? "default" : "outline"}
            onClick={() => setPeriod("diario")}
            className="h-10 gap-1.5 text-xs sm:text-sm"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Diario
          </Button>
          <Button
            variant={period === "semanal" ? "default" : "outline"}
            onClick={() => setPeriod("semanal")}
            className="h-10 gap-1.5 text-xs sm:text-sm"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Semanal
          </Button>
          <Button
            variant={period === "mensual" ? "default" : "outline"}
            onClick={() => setPeriod("mensual")}
            className="h-10 gap-1.5 text-xs sm:text-sm"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Mensual
          </Button>
          <Button
            variant={period === "anual" ? "default" : "outline"}
            onClick={() => setPeriod("anual")}
            className="h-10 gap-1.5 text-xs sm:text-sm"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Anual
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ventas {pl.ventas}
                </p>
                <p className="text-2xl font-bold">
                  {formatQ(currentTotal)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              +12.5% vs periodo anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Gastos {pl.gastos}
                </p>
                <p className="text-2xl font-bold">
                  {formatQ(currentExpenses)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              -3.2% vs periodo anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ganancia neta
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatQ(currentProfit)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Margen:{" "}
              {currentTotal > 0
                ? `${((currentProfit / currentTotal) * 100).toFixed(1)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Tendencia de ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows}>
                  <defs>
                    <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
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
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [formatQ(value), "Ventas"]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2}
                    fill="url(#salesGradient2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Ventas vs gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <XAxis
                    dataKey="label"
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
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      formatQ(value),
                      name === "sales" ? "Ventas" : "Gastos",
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "sales" ? "Ventas" : "Gastos"
                    }
                  />
                  <Bar
                    dataKey="sales"
                    fill="hsl(160, 84%, 39%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Desglose {pl.desglose}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    {pl.columna}
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Ventas
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Gastos
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Ganancia
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-muted-foreground">
                    Margen
                  </th>
                </tr>
              </thead>
              <tbody>
                {chartRows.map((row, index) => {
                  const profit = row.sales - row.expenses
                  const margin =
                    row.sales > 0
                      ? ((profit / row.sales) * 100).toFixed(1)
                      : "—"
                  return (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 font-medium">{row.label}</td>
                      <td className="py-3 text-right">
                        {formatQ(row.sales)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatQ(row.expenses)}
                      </td>
                      <td className="py-3 text-right font-medium text-primary">
                        {formatQ(profit)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {margin}
                        {margin !== "—" ? "%" : ""}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
