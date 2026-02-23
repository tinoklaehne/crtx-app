/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export only when doing a production build and not on Vercel (dev uses server so middleware/auth work)
  ...(process.env.VERCEL || process.env.NODE_ENV !== 'production' ? {} : { output: 'export' }),
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
  webpack: (config) => {
    config.cache = config.cache ?? { type: 'filesystem', allowCollectingMemory: true };
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