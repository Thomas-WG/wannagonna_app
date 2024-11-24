import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();//this is the plugin for internationalization

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
