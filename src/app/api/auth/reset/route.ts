import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import Redis from "ioredis";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  return redis;
}

export async function POST(req: NextRequest) {
  let token: string, password: string;
  try {
    const body = await req.json();
    token = (body.token ?? "").toString().trim();
    password = (body.password ?? "").toString();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "A password deve ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }

  const key = `pwreset:${token}`;
  let userId: string | null;

  try {
    const r = getRedis();
    userId = await r.get(key);
  } catch {
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Link expirado ou já utilizado. Solicite um novo link de recuperação." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar password." }, { status: 500 });
  }

  // Invalidar token de reset e marcar timestamp para forçar logout de sessões antigas
  try {
    const r = getRedis();
    await r.del(key);
    // Sessões com iat anterior a este timestamp serão rejeitadas em getAuthSession()
    await r.setex(`pwchanged:${userId}`, 8 * 3600, String(Date.now()));
  } catch {
    // Non-fatal: o utilizador pode ainda ter sessões antigas activas até expirarem naturalmente
  }

  return NextResponse.json({ ok: true });
}
