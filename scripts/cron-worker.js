/**
 * Medfreela — Cron Worker
 *
 * Calls POST /api/cron/atualizar-status every minute to drive automatic
 * plantão status transitions:
 *   ABERTO/FECHADO → EM_ANDAMENTO (on shift start)
 *   EM_ANDAMENTO   → CONCLUIDO   (on shift end, releases payment)
 *
 * Managed by pm2 as "medfreela-cron" (see ecosystem.config.js).
 * Required env vars:
 *   APP_BASE_URL  — e.g. http://localhost:3000
 *   CRON_SECRET   — shared secret with the Next.js API route
 */

"use strict";

const BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const SECRET   = process.env.CRON_SECRET   || "";
const INTERVAL = 60 * 1000; // 1 minute

async function tick() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(`${BASE_URL}/api/cron/atualizar-status`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SECRET}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000), // 30s timeout per run
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "(unreadable)");
      console.error(`[cron] ${ts} HTTP ${res.status}: ${body}`);
      return;
    }

    const data = await res.json();
    const { emAndamento = 0, concluidos = 0, erros = 0 } = data;
    if (emAndamento || concluidos || erros) {
      console.log(`[cron] ${ts} — EM_ANDAMENTO: ${emAndamento}, CONCLUIDOS: ${concluidos}, ERROS: ${erros}`);
    }
  } catch (err) {
    console.error(`[cron] ${ts} fetch failed:`, err.message);
  }
}

// Run immediately on startup then on interval
tick();
setInterval(tick, INTERVAL);
