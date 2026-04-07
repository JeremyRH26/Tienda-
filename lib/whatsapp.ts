/**
 * Normaliza a dígitos para wa.me (Guatemala: 502 + número local).
 */
export function digitsForWhatsApp(raw: string): string | null {
  const d = raw.replace(/\D/g, "")
  if (d.length === 0) return null
  if (d.startsWith("502") && d.length >= 11) return d
  if (d.length === 8 || d.length === 7) return `502${d}`
  if (d.length >= 10 && d.length <= 15) return d
  return null
}

export function openWhatsAppDebtReminder(
  phoneRaw: string,
  customerName: string,
  balanceFormatted: string,
  storeName = "nuestra tienda"
): boolean {
  const phone = digitsForWhatsApp(phoneRaw)
  if (!phone || phone.length < 10) return false

  const greeting = customerName.trim() ? `Hola ${customerName.trim()}` : "Hola"
  const text = `${greeting}, le recordamos que tiene un saldo pendiente de ${balanceFormatted} en ${storeName}. Gracias.`
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  window.open(url, "_blank", "noopener,noreferrer")
  return true
}
