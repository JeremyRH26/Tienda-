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
import { formatQ, formatQChartTick } from "@/lib/currency"
import {
  formatReportPeriodCaption,
  type ReportPeriodUi,
  type ReportSummary,
} from "@/lib/report-metrics"
import { downloadBusinessReportPdf } from "@/lib/pdf-reports"
import { downloadBusinessReportXlsx } from "@/lib/report-export-xlsx"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Area,
  Bar,
  BarChart,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { useGetReportFull } from "@/hooks/use-get-report-full"
import {
  computeReportWindow,
  formatMysqlDateOnly,
  formatMysqlDateTime,
} from "@/lib/report-date-range"
import type { ReportFullQueryParams } from "@/lib/services/reports.service"
import type { DateRange } from "react-day-picker"
import { startOfDay } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"

function dateAtNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

function startOfMonthNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0)
}

/**
 * Rango para API: día inicio a 00:00:00 y día fin a 23:59:59 (incluye todo el último día).
 * Las fechas del picker pueden ir a mediodía; aquí solo importa el calendario.
 */
function boundsFromDateRange(r: DateRange): { start: Date; end: Date } | null {
  if (!r.from) return null
  let a = dateAtNoon(r.from)
  let b = dateAtNoon(r.to ?? r.from)
  if (a.getTime() > b.getTime()) {
    const t = a
    a = b
    b = t
  }
  const y1 = a.getFullYear()
  const m1 = a.getMonth()
  const d1 = a.getDate()
  const y2 = b.getFullYear()
  const m2 = b.getMonth()
  const d2 = b.getDate()
  return {
    start: new Date(y1, m1, d1, 0, 0, 0, 0),
    end: new Date(y2, m2, d2, 23, 59, 59, 999),
  }
}

function formatRangeTriggerLabel(r: DateRange): string {
  if (!r.from) return "Elegir fechas"
  const a = r.from.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
  })
  if (r.to == null || r.to.getTime() === r.from.getTime()) {
    return a
  }
  const c = r.to.toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${a} – ${c}`
}

function emptySummary(caption: string): ReportSummary {
  return {
    periodCaption: caption,
    totalCobrado: 0,
    totalCosto: 0,
    totalMargen: 0,
    totalGastos: 0,
    totalAbonos: 0,
    totalFiado: 0,
    countVentas: 0,
    countFiado: 0,
    resultadoOperativo: 0,
  }
}

function ChartInsufficientPlaceholder() {
  return (
    <div className="flex h-60 sm:h-72 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/25 px-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        No hay datos suficientes para mostrar la gráfica.
      </p>
    </div>
  )
}

const GASTOS_PIE_COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(217, 91%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(24, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(45, 93%, 47%)",
  "hsl(var(--muted-foreground))",
]

export function Reportes() {
  const isMobile = useIsMobile()
  const [period, setPeriod] = useState<ReportPeriodUi>("semanal")
  const [refDate, setRefDate] = useState(() => dateAtNoon(new Date()))
  const [rangoPopoverOpen, setRangoPopoverOpen] = useState(false)
  const [reportDateRange, setReportDateRange] = useState<DateRange>(() => ({
    from: startOfMonthNoon(new Date()),
    to: dateAtNoon(new Date()),
  }))

  /**
   * pickerRange: estado interno del calendario mientras el popover está abierto.
   * pickingEnd: true cuando el usuario ya eligió el día inicio y espera elegir el fin.
   * Así controlamos totalmente en qué fase estamos y nunca cerramos antes de tiempo.
   */
  const [pickerRange, setPickerRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [pickingEnd, setPickingEnd] = useState(false)

  /** Rango por defecto del selector «Rango» (mes actual → hoy). */
  function defaultReportDateRange(): DateRange {
    return {
      from: startOfMonthNoon(new Date()),
      to: dateAtNoon(new Date()),
    }
  }

  /**
   * Al salir de «Rango» o elegir otro periodo estándar: ancla el informe a hoy y
   * limpia el rango guardado para no arrastrar la fecha del calendario de rango a semanal/diario/etc.
   */
  function applyStandardPeriod(next: Exclude<ReportPeriodUi, "rango">) {
    setRangoPopoverOpen(false)
    setRefDate(dateAtNoon(new Date()))
    setReportDateRange(defaultReportDateRange())
    setPickerRange({ from: undefined, to: undefined })
    setPickingEnd(false)
    setPeriod(next)
  }

  const reportQuery = useMemo((): ReportFullQueryParams | null => {
    try {
      const rangeBounds =
        period === "rango" ? boundsFromDateRange(reportDateRange) : null
      const win = computeReportWindow(
        period,
        refDate,
        rangeBounds ? { start: rangeBounds.start, end: rangeBounds.end } : undefined
      )
      return {
        grouping: period,
        startDate: formatMysqlDateTime(win.start),
        endDate: formatMysqlDateTime(win.end),
        refDate: formatMysqlDateOnly(win.refForKpi),
      }
    } catch {
      return null
    }
  }, [period, refDate, reportDateRange])

  const { data, isLoading, isFetching, error } = useGetReportFull(reportQuery)

  const summary = useMemo((): ReportSummary => {
    const rb = period === "rango" ? boundsFromDateRange(reportDateRange) : null
    const caption =
      period === "rango" && rb
        ? formatReportPeriodCaption(period, refDate, {
            start: rb.start,
            end: rb.end,
          })
        : formatReportPeriodCaption(period, refDate)
    if (!data?.indicators) {
      return emptySummary(caption)
    }
    const ind = data.indicators
    return {
      periodCaption: caption,
      totalCobrado: ind.totalCobrado,
      totalCosto: ind.totalCosto,
      totalMargen: ind.totalMargen,
      totalGastos: ind.totalGastos,
      totalAbonos: ind.totalAbonos,
      totalFiado: ind.totalFiado,
      countVentas: ind.countVentas,
      countFiado: ind.countFiado,
      resultadoOperativo: ind.resultadoOperativo,
    }
  }, [data, period, refDate, reportDateRange])

  const chartRows = useMemo(() => {
    if (!data?.ventasVsGastos?.length) return []
    return data.ventasVsGastos.map((r) => ({
      label: r.label,
      sales: r.sales,
      expenses: r.expenses,
    }))
  }, [data])

  const trendChartData = useMemo(() => {
    if (data?.tendencia?.length) {
      return data.tendencia.map((t) => ({ label: t.label, sales: t.sales }))
    }
    if (chartRows.length) {
      return chartRows.map((r) => ({ label: r.label, sales: r.sales }))
    }
    return []
  }, [data?.tendencia, chartRows])

  const margenSerieRows = useMemo(
    () => data?.margenSerie ?? [],
    [data?.margenSerie],
  )

  /** Misma granularidad que tendencia; margen 0 si el label no viene en margenSerie. */
  const trendYMargenChartData = useMemo(() => {
    if (!trendChartData.length) return []
    const marginByLabel = new Map(
      margenSerieRows.map((r) => [r.label, Number(r.margin) || 0]),
    )
    return trendChartData.map((t) => ({
      label: t.label,
      sales: t.sales,
      margin: marginByLabel.get(t.label) ?? 0,
    }))
  }, [trendChartData, margenSerieRows])

  const fiadoAbonosRows = useMemo(
    () => data?.fiadoAbonosSerie ?? [],
    [data?.fiadoAbonosSerie],
  )

  const chartsReady = !isLoading && !error && data != null

  const canShowTrendChart =
    chartsReady &&
    trendYMargenChartData.length > 0 &&
    trendYMargenChartData.some(
      (r) => Number(r.sales) > 0 || Number(r.margin) > 0,
    )

  const canShowBarChart =
    chartsReady &&
    chartRows.length > 0 &&
    chartRows.some((r) => Number(r.sales) > 0 || Number(r.expenses) > 0)

  const canShowDesglose = useMemo(() => {
    const rows = data?.desglose
    if (!rows?.length) return false
    return rows.some(
      (r) => Number(r.ventasCobradas) > 0 || Number(r.gastos) > 0,
    )
  }, [data?.desglose])

  const gastosPorTipoRows = useMemo(
    () => data?.gastosPorTipo ?? [],
    [data?.gastosPorTipo],
  )

  const canShowGastosDonut =
    chartsReady &&
    gastosPorTipoRows.length > 0 &&
    gastosPorTipoRows.some((r) => Number(r.amount) > 0)

  const canShowFiadoAbonosChart =
    chartsReady &&
    fiadoAbonosRows.length > 0 &&
    fiadoAbonosRows.some(
      (r) => Number(r.abonos) > 0 || Number(r.fiado) > 0,
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
    rango: {
      ventas: "cobradas (rango)",
      desglose: "por día del rango",
      columna: "Día",
    },
  } as const

  const pl = periodLabels[period]

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  }

  const xAxisInterval =
    period === "diario"
      ? 3
      : period === "rango" && chartRows.length > 16
        ? 2
        : 0

  const exportPdf = () => {
    void downloadBusinessReportPdf(summary, chartRows, period, new Date())
  }

  const exportExcel = () => {
    void downloadBusinessReportXlsx(summary, chartRows, period, new Date())
  }

  const loadError =
    error instanceof Error ? error.message : "No se pudo cargar el reporte."

  /** Texto del botón Rango mientras el popover está abierto */
  function rangoInProgressLabel(): string {
    if (!pickingEnd || !pickerRange.from) return "Elegir inicio…"
    return `${pickerRange.from.toLocaleDateString("es-GT", { day: "numeric", month: "short" })} → elegir fin`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Reportes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Rendimiento según ventas cobradas, gastos y abonos registrados en el sistema
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{summary.periodCaption}</p>
          {error ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {loadError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button
              variant={period === "diario" ? "default" : "outline"}
              onClick={() => applyStandardPeriod("diario")}
              className="h-10 gap-1.5 text-xs sm:text-sm"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Diario
            </Button>
            <Button
              variant={period === "semanal" ? "default" : "outline"}
              onClick={() => applyStandardPeriod("semanal")}
              className="h-10 gap-1.5 text-xs sm:text-sm"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Semanal
            </Button>
            <Button
              variant={period === "mensual" ? "default" : "outline"}
              onClick={() => applyStandardPeriod("mensual")}
              className="h-10 gap-1.5 text-xs sm:text-sm"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Mensual
            </Button>
            <Button
              variant={period === "anual" ? "default" : "outline"}
              onClick={() => applyStandardPeriod("anual")}
              className="h-10 gap-1.5 text-xs sm:text-sm"
            >
              <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Anual
            </Button>

            {/* ── Selector de rango ─────────────────────────────────── */}
            <Popover
              open={rangoPopoverOpen}
              onOpenChange={(open) => {
                if (open) {
                  // Abrir sin pre-selección para que el primer clic sea siempre el inicio real
                  setPickerRange({ from: undefined, to: undefined })
                  setPickingEnd(false)
                  setPeriod("rango")
                  setRangoPopoverOpen(true)
                } else {
                  // Cerrar sin completar: confirmar con lo que haya (no tocar refDate: es solo para periodos estándar)
                  if (pickerRange.from != null) {
                    const d = pickerRange.from
                    const finalTo = pickerRange.to ?? d
                    setReportDateRange({ from: d, to: finalTo })
                  }
                  setPickingEnd(false)
                  setRangoPopoverOpen(false)
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={period === "rango" ? "default" : "outline"}
                  className="h-10 max-w-[min(100%,16rem)] gap-1.5 text-xs sm:max-w-[20rem] sm:text-sm"
                >
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">
                    {period === "rango"
                      ? rangoPopoverOpen
                        ? rangoInProgressLabel()
                        : formatRangeTriggerLabel(reportDateRange)
                      : "Rango"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="end"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="p-0" onMouseDown={(e) => e.preventDefault()}>
                  <CalendarPicker
                    mode="range"
                    min={1}
                    numberOfMonths={isMobile ? 1 : 2}
                    selected={pickerRange}
                    disabled={
                      pickingEnd && pickerRange.from != null
                        ? { before: startOfDay(pickerRange.from) }
                        : undefined
                    }
                    onSelect={(_r, triggerDate) => {
                      // Siempre usamos triggerDate: es el día real que el usuario clicó,
                      // independientemente de lo que addToRange devuelva con la pre-selección.
                      if (!triggerDate) return

                      if (!pickingEnd) {
                        // Fase 1: fijar inicio
                        setPickerRange({ from: triggerDate, to: undefined })
                        setPickingEnd(true)
                        return
                      }

                      // Fase 2: fijar fin (puede ser el mismo día que el inicio)
                      const from = pickerRange.from
                      if (!from) return
                      const to = triggerDate

                      setPickerRange({ from, to })
                      setReportDateRange({ from, to })
                      setPickingEnd(false)
                      queueMicrotask(() => setRangoPopoverOpen(false))
                    }}
                    defaultMonth={reportDateRange.from ?? refDate}
                  />
                </div>
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
              disabled={isLoading || !!error}
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
              disabled={isLoading || !!error}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {isLoading || isFetching ? (
        <p className="text-sm text-muted-foreground">Cargando datos del reporte…</p>
      ) : null}

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
              Suma de gastos
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
            <p className="mt-2 text-xs text-muted-foreground">Suma de abonos</p>
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
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Ganancia bruta de ventas cobradas menos gastos del periodo.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Ventas cobradas y margen bruto
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Ventas en el eje izquierdo; margen bruto (Q) en el derecho. Misma escala temporal por punto.
            </p>
          </CardHeader>
          <CardContent>
            {chartsReady && !canShowTrendChart ? (
              <ChartInsufficientPlaceholder />
            ) : (
              <div className="h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendYMargenChartData}>
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
                      interval={xAxisInterval}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(160, 84%, 39%)", fontSize: 11 }}
                      tickFormatter={(value) => formatQChartTick(Number(value))}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(217, 91%, 55%)", fontSize: 11 }}
                      tickFormatter={(value) => formatQChartTick(Number(value))}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) => [
                        formatQ(value),
                        name === "Ventas cobradas" ? "Ventas cobradas" : "Margen bruto",
                      ]}
                      labelFormatter={(label) => String(label)}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "Ventas cobradas" ? "Ventas cobradas" : "Margen bruto (Q)"
                      }
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      name="Ventas cobradas"
                      stroke="hsl(160, 84%, 39%)"
                      strokeWidth={2}
                      fill="url(#salesGradientReport)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="margin"
                      name="Margen bruto"
                      stroke="hsl(217, 91%, 55%)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(217, 91%, 55%)" }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ventas cobradas vs gastos</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsReady && !canShowBarChart ? (
              <ChartInsufficientPlaceholder />
            ) : (
              <div className="h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartRows}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      interval={xAxisInterval}
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
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsReady && !canShowGastosDonut ? (
              <ChartInsufficientPlaceholder />
            ) : (
              <div className="h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gastosPorTipoRows}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius="48%"
                      outerRadius="72%"
                      paddingAngle={2}
                    >
                      {gastosPorTipoRows.map((slice, i) => (
                        <Cell
                          key={`${slice.label}-${i}`}
                          fill={GASTOS_PIE_COLORS[i % GASTOS_PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => formatQ(Number(value))}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      formatter={(value) => String(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Abonos vs ventas al fiado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Totales del periodo: abonos registrados frente a monto vendido a crédito.
            </p>
          </CardHeader>
          <CardContent>
            {chartsReady && !canShowFiadoAbonosChart ? (
              <ChartInsufficientPlaceholder />
            ) : (
              <div className="h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fiadoAbonosRows}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                      interval={xAxisInterval}
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
                        name === "Abonos" ? "Abonos" : "Ventas al fiado",
                      ]}
                      labelFormatter={(label) => String(label)}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "Abonos" ? "Abonos" : "Ventas al fiado"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="abonos"
                      name="Abonos"
                      stroke="hsl(160, 84%, 39%)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(160, 84%, 39%)" }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fiado"
                      name="Ventas al fiado"
                      stroke="hsl(24, 95%, 48%)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(24, 95%, 48%)" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Desglose {pl.desglose}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartsReady && !canShowDesglose ? (
            <ChartInsufficientPlaceholder />
          ) : (
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
                  {(data?.desglose?.length ? data.desglose : []).map((row, index) => {
                    const profit = row.ganancia
                    const margin =
                      row.margenPct != null && Number.isFinite(row.margenPct)
                        ? row.margenPct.toFixed(1)
                        : row.ventasCobradas > 0
                          ? (
                              ((row.ventasCobradas - row.gastos) / row.ventasCobradas) *
                              100
                            ).toFixed(1)
                          : "—"
                    return (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 font-medium">{row.label}</td>
                        <td className="py-3 text-right">{formatQ(row.ventasCobradas)}</td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatQ(row.gastos)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
