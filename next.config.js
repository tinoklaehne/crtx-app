/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static export for Netlify deployment
  output: 'export',
  trailingSlash: true,
  images: { 
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure proper asset prefix for static export
  assetPrefix: '',
  // Disable webpack caching to prevent file system errors
  webpack: (config) => {
    config.cache = false;
    // Ensure Airtable is only bundled for server-side
    config.externals = config.externals || [];
    if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
      config.externals = [config.externals];
    }
    config.externals.push({
      'airtable': 'commonjs airtable'
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
    };
    return config;
  }
};

module.exports = nextConfig;