import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();//this is the plugin for internationalization

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'firebasestorage.googleapis.com',
      'storage.googleapis.com'
    ],
  },
};

export default withNextIntl(nextConfig);
