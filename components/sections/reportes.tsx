"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  Landmark,
} from "lucide-react"
import { useBusiness } from "@/lib/business-context"
import { mockSalesHistoryExtended, mockProducts, type SaleRecord } from "@/lib/mock-data"
import { formatQ, formatQChartTick } from "@/lib/currency"
import {
  buildReportChartRows,
  buildReportSummary,
  type ReportPeriodUi,
} from "@/lib/report-metrics"
import { downloadBusinessReportPdf } from "@/lib/pdf-reports"
import { downloadBusinessReportXlsx } from "@/lib/report-export-xlsx"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

function dateAtNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

export function Reportes() {
  const { expenses, abonos } = useBusiness()
  const [period, setPeriod] = useState<ReportPeriodUi>("semanal")
  const [refDate, setRefDate] = useState(() => dateAtNoon(new Date()))
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [salesHistory] = useState<SaleRecord[]>(() =>
    mockSalesHistoryExtended.map((s) => ({ ...s, timestamp: new Date(s.timestamp) }))
  )

  const summary = useMemo(
    () =>
      buildReportSummary(
        salesHistory,
        expenses,
        abonos,
        mockProducts,
        period,
        refDate
      ),
    [salesHistory, expenses, abonos, period, refDate]
  )

  const chartRows = useMemo(
    () => buildReportChartRows(salesHistory, expenses, period, refDate),
    [salesHistory, expenses, period, refDate]
  )

  const periodLabels = {
    diario: {
      ventas: "cobradas (día)",
      desglose: "por hora",
      columna: "Hora",
    },
    semanal: {
      ventas: "cobradas (semana)",
      desglose: "por día",
      columna: "Día",
    },
    mensual: {
      ventas: "cobradas (6 meses)",
      desglose: "por mes",
      columna: "Mes",
    },
    anual: {
      ventas: "cobradas (año)",
      desglose: "por mes del año",
      columna: "Mes",
    },
  } as const

  const pl = periodLabels[period]

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  }

  const exportPdf = () => {
    void downloadBusinessReportPdf(summary, chartRows, period, new Date())
  }

  const exportExcel = () => {
    void downloadBusinessReportXlsx(summary, chartRows, period, new Date())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Reportes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Rendimiento según ventas de ejemplo, gastos y abonos registrados
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{summary.periodCaption}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
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
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="h-10 gap-1.5 text-xs sm:text-sm">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  Fecha
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="single"
                  selected={refDate}
                  onSelect={(d) => {
                    if (d) {
                      setRefDate(dateAtNoon(d))
                      setCalendarOpen(false)
                    }
                  }}
                  defaultMonth={refDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={exportPdf}
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={exportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas {pl.ventas}</p>
                <p className="text-2xl font-bold">{formatQ(summary.totalCobrado)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Efectivo y tarjeta · {summary.countVentas} movimiento
              {summary.countVentas !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold">{formatQ(summary.totalGastos)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {period === "mensual" || period === "anual"
                ? "Suma de gastos en el periodo del informe"
                : "Total del mes de la fecha seleccionada (igual que Dashboard y Gastos)"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abonos</p>
                <p className="text-2xl font-bold text-emerald-600">{formatQ(summary.totalAbonos)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Landmark className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Clientes · periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm ring-1 ring-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganancia bruta ventas</p>
                <p className="text-2xl font-bold text-foreground">{formatQ(summary.totalMargen)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Costo inventario: {formatQ(summary.totalCosto)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resultado</p>
                <p className="text-2xl font-bold text-primary">
                  {formatQ(summary.resultadoOperativo)}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ganancia bruta − gastos · Fiado: {formatQ(summary.totalFiado)} (
              {summary.countFiado})
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tendencia de ventas cobradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartRows}>
                  <defs>
                    <linearGradient id="salesGradientReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    interval={period === "diario" ? 3 : 0}
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
                    fill="url(#salesGradientReport)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ventas cobradas vs gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    interval={period === "diario" ? 3 : 0}
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
                    formatter={(value) => (value === "sales" ? "Ventas" : "Gastos")}
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
          <CardTitle className="text-base font-semibold">Desglose {pl.desglose}</CardTitle>
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
                    Ventas cobradas
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
                      <td className="py-3 text-right">{formatQ(row.sales)}</td>
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
