import type { NextConfig } from "next";

/**
 * Baseline security headers.
 *
 * A nonce based Content-Security-Policy is deliberately left out: Next.js needs
 * middleware support to inject the nonce and an incorrect policy silently breaks
 * hydration. Add it together with an integration test when the app grows a CDN
 * layer.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Stops advertising the framework version through the `X-Powered-By` header.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

