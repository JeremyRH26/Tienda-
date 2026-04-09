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
}

export default nextConfig
