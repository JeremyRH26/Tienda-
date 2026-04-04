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

/** Eje de gráficos: miles de Q */
export function formatQChartTick(value: number): string {
  if (value >= 1000) return `Q${(value / 1000).toFixed(0)}k`
  return formatQ(value)
}

export function isSameCalendarDay(date: Date, reference: Date = new Date()): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  )
}
