import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail, BASE_URL } from "@/lib/email";
import Redis from "ioredis";
import crypto from "crypto";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  return redis;
}

const TOKEN_TTL = 30 * 60; // 30 minutos em segundos

// Rate limit: máx. 3 pedidos por email por hora
async function checkRateLimit(email: string): Promise<boolean> {
  const key = `pwreset:rl:${email}`;
  try {
    const r = getRedis();
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, 3600);
    return count <= 3;
  } catch {
    return true; // graceful degradation
  }
}

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").toString().trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const allowed = await checkRateLimit(email);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados pedidos. Aguarde 1 hora antes de tentar novamente." },
      { status: 429 }
    );
  }

  // Verificar se o utilizador existe (sem revelar se existe ou não por segurança)
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString("hex");
    const key = `pwreset:${token}`;

    try {
      const r = getRedis();
      await r.setex(key, TOKEN_TTL, user.id);
    } catch {
      return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
    }

    const resetUrl = `${BASE_URL}/login/reset?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  // Sempre retornar sucesso para não revelar se o email existe
  return NextResponse.json({ ok: true });
}
