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
  // Habilitar i18n si se necesita después
  // i18n: {
  //   locales: ['es', 'en'],
  //   defaultLocale: 'es',
  // },
}

module.exports = nextConfig
