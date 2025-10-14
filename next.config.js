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
