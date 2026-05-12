module.exports = {
  apps: [
    // ── Main Next.js application ───────────────────────────────────────────
    {
      name: "medfreela",
      script: "/var/www/medfreela/start-server.sh",
      cwd: "/var/www/medfreela",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },

    // ── Cron worker: drives plantão status transitions every minute ────────
    // Requires CRON_SECRET env var (same value as in .env on the Next.js app).
    {
      name: "medfreela-cron",
      script: "scripts/cron-worker.js",
      cwd: "/var/www/medfreela",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "64M",
      env: {
        NODE_ENV: "production",
        APP_BASE_URL: "http://localhost:3000",
        // CRON_SECRET is read from the shell environment or set here:
        // CRON_SECRET: "your-secret-here",
      },
    },
  ],
};
