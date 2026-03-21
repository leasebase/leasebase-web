/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA || 'dev-local';
    const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dev.leasebase.ai';
    return [
      {
        // Apply security and cache headers to all non-static routes
        source: '/((?!_next/static|_next/image|favicon\\.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'X-App-Version',
            value: buildSha,
          },
          // ── Security headers ──────────────────────────────────────
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
            `connect-src 'self' ${apiOrigin} https://*.amazoncognito.com https://api.stripe.com https://*.stripe.com https://*.i.posthog.com https://*.s3.amazonaws.com https://*.s3.us-west-2.amazonaws.com https://*.s3.us-east-1.amazonaws.com`,
              "img-src 'self' data: blob: https://*.stripe.com",
              "font-src 'self'",
              "frame-src 'self' https://js.stripe.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    // Legal documents are now hosted on the public WordPress site.
    // Redirect old app-hosted /legal/* paths to canonical WordPress URLs.
    const wpBase = 'https://leasebase.ai';
    return [
      { source: '/legal/terms', destination: `${wpBase}/terms-of-service/`, permanent: true },
      { source: '/legal/privacy', destination: `${wpBase}/privacy-policy/`, permanent: true },
      { source: '/legal/payments', destination: `${wpBase}/payment-terms/`, permanent: true },
      { source: '/legal/owner-agreement', destination: `${wpBase}/property-owner-agreement/`, permanent: true },
      { source: '/legal/tenant-agreement', destination: `${wpBase}/tenant-user-agreement/`, permanent: true },
      { source: '/legal', destination: `${wpBase}/terms-of-service/`, permanent: true },
    ];
  },
  // No rewrites / API proxy.  All browser-side API calls use the explicit
  // NEXT_PUBLIC_API_BASE_URL (e.g. https://api.dev.leasebase.ai) so there
  // is no hidden same-origin proxying to debug.
};

export default nextConfig;
