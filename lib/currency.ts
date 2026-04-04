const gtq = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Formato en quetzales (GTQ) para la interfaz */
export function formatQ(amount: number): string {
  return gtq.format(amount)
}

/** Eje de gráficos: valores compactos en quetzales (Q) */
export function formatQChartTick(value: number): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return ""
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000
    const s = m >= 10 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, "")
    return `${sign}Q${s}M`
  }
  if (abs >= 1000) return `${sign}Q${Math.round(abs / 1000)}k`
  return formatQ(n)
}

export function isSameCalendarDay(date: Date, reference: Date = new Date()): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  )
}
