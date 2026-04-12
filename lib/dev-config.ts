/**
 * Prueba solo el módulo Gastos sin pasar por login ni sidebar.
 * En `.env.local`: NEXT_PUBLIC_DEV_GASTOS_STANDALONE=true
 * Luego abre: /dev/gastos
 */
export const isDevGastosStandalone =
  process.env.NEXT_PUBLIC_DEV_GASTOS_STANDALONE === "true"
