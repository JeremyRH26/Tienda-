"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { mockSalesData, mockMonthlySales } from "@/lib/mock-data"
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

export function Reportes() {
  const [period, setPeriod] = useState<"semanal" | "mensual">("semanal")

  const weeklyTotal = mockSalesData.reduce((acc, d) => acc + d.sales, 0)
  const weeklyExpenses = mockSalesData.reduce((acc, d) => acc + d.expenses, 0)
  const monthlyTotal = mockMonthlySales.reduce((acc, m) => acc + m.sales, 0)
  const monthlyExpenses = mockMonthlySales.reduce((acc, m) => acc + m.expenses, 0)

  const currentData = period === "semanal" ? mockSalesData : mockMonthlySales
  const currentTotal = period === "semanal" ? weeklyTotal : monthlyTotal
  const currentExpenses = period === "semanal" ? weeklyExpenses : monthlyExpenses
  const currentProfit = currentTotal - currentExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Reportes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Analiza el rendimiento de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === "semanal" ? "default" : "outline"}
            onClick={() => setPeriod("semanal")}
            className="h-10 flex-1 gap-2 sm:flex-none"
          >
            <Calendar className="h-4 w-4" />
            <span className="sm:inline">Semanal</span>
          </Button>
          <Button
            variant={period === "mensual" ? "default" : "outline"}
            onClick={() => setPeriod("mensual")}
            className="h-10 flex-1 gap-2 sm:flex-none"
          >
            <Calendar className="h-4 w-4" />
            <span className="sm:inline">Mensual</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Ventas {period === "semanal" ? "Semanales" : "del Semestre"}
                </p>
                <p className="text-2xl font-bold">
                  ${currentTotal.toLocaleString()}
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
                  Gastos {period === "semanal" ? "Semanales" : "del Semestre"}
                </p>
                <p className="text-2xl font-bold">
                  ${currentExpenses.toLocaleString()}
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
                  Ganancia Neta
                </p>
                <p className="text-2xl font-bold text-primary">
                  ${currentProfit.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Margen: {((currentProfit / currentTotal) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Area Chart - Sales Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Tendencia de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData}>
                  <defs>
                    <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey={period === "semanal" ? "day" : "month"}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Ventas",
                    ]}
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

        {/* Bar Chart - Sales vs Expenses */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Ventas vs Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentData}>
                  <XAxis
                    dataKey={period === "semanal" ? "day" : "month"}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === "sales" ? "Ventas" : "Gastos",
                    ]}
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

      {/* Detailed Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Desglose {period === "semanal" ? "Diario" : "Mensual"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    {period === "semanal" ? "Día" : "Mes"}
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
                {currentData.map((row, index) => {
                  const profit = row.sales - row.expenses
                  const margin = ((profit / row.sales) * 100).toFixed(1)
                  return (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {"day" in row ? row.day : row.month}
                      </td>
                      <td className="py-3 text-right">
                        ${row.sales.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        ${row.expenses.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium text-primary">
                        ${profit.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {margin}%
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
