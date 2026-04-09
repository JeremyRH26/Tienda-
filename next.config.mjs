/**
 * Nota: minificar / optimizar el output de `next build` no baja la RAM de `next dev`.
 * En dev, Next recompila en caliente (Turbopack) sin usar ese bundle minificado.
 *
 * Lo que sí ayuda en dev: imports puntuales (evitar `import *`), optimizePackageImports,
 * NODE_OPTIONS --max-old-space-size, y `next start` tras build para pruebas “tipo prod”.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Acceso al dev server desde otra máquina / IP en la red (HMR). */
  allowedDevOrigins: ["*"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Solo desarrollo: menos páginas compiladas en buffer (default 5 / 60s).
   * Puede aliviar RAM al saltar entre muchas rutas; la primera visita a una ruta puede ser un poco más lenta.
   */
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 3,
  },
  /** Menos trabajo y RAM en `next build`; no afecta `next dev`. */
  productionBrowserSourceMaps: false,
  /** Reduce análisis/bundle al importar solo lo usado de paquetes grandes (dev y build). */
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
}

export default nextConfig
