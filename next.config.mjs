import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();//this is the plugin for internationalization

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9199',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        pathname: '/**',
      },
    ],
    // Disable image optimization for localhost in development
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default withNextIntl(nextConfig);
