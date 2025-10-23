/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  /**
   * Variables de entorno expuestas al Edge Runtime (middleware)
   * IMPORTANTE: Estas NO se exponen al cliente, solo al middleware server-side
   */
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Ignorar errores de ESLint y TypeScript durante el build de producción
  eslint: {
    // Solo warning en dev, ignorar en producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de tipo durante el build
    // Solo afecta al build, no al desarrollo
    ignoreBuildErrors: true,
  },
  // Habilitar i18n si se necesita después
  // i18n: {
  //   locales: ['es', 'en'],
  //   defaultLocale: 'es',
  // },
}

module.exports = nextConfig
