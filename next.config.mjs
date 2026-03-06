/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        // Prevent aggressive caching of HTML pages by shared caches
        source: '/((?!_next/static|_next/image|favicon\\.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // No rewrites / API proxy.  All browser-side API calls use the explicit
  // NEXT_PUBLIC_API_BASE_URL (e.g. https://api.dev.leasebase.co) so there
  // is no hidden same-origin proxying to debug.
};

export default nextConfig;
