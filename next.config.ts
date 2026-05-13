import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// unsafe-eval only in dev (needed for Next.js HMR/hot reload)
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const securityHeaders = [
  // Impede clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Impede MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desativa funcionalidades perigosas do browser
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS — força HTTPS por 1 ano (só produção; em dev não se usa HTTPS)
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc} https://static.cloudflareinsights.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://cloudflareinsights.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["web-push", "ioredis", "nodemailer", "pg", "pg-connection-string", "pgpass"],
  async headers() {
    return [
      {
        // Service worker must never be served from HTTP cache — browser caches the old
        // version otherwise, blocking updates from deploying for hours
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
