/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow MQTT websocket connections from browser
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
