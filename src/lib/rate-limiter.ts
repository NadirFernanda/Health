/**
 * Rate Limiter com Redis
 * Implementa rate limiting para features como criação de support tickets
 */

import Redis from "ioredis";

// Usar singleton para evitar múltiplas conexões
let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }
  return redisInstance;
}

export interface RateLimitConfig {
  /** Máximo de requisições permitidas */
  maxRequests: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
  /** Chave de identificação do cliente (ex: user_id) */
  key: string;
}

/**
 * Verificar se uma ação está dentro do rate limit
 * @returns { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const redis = getRedis();
  const redisKey = `ratelimit:${config.key}`;

  try {
    // Incrementar contador
    const current = await redis.incr(redisKey);

    // Se é a primeira requisição nesta janela, definir expiration
    if (current === 1) {
      await redis.expire(redisKey, config.windowSeconds);
    }

    // Obter TTL para saber quando reseta
    const ttl = await redis.ttl(redisKey);
    const resetAt = new Date(Date.now() + ttl * 1000);

    const allowed = current <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current);

    return {
      allowed,
      remaining,
      resetAt,
    };
  } catch (error) {
    // Se Redis falhar, permitir a requisição (graceful degradation)
    console.error("Rate limiter error:", error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowSeconds * 1000),
    };
  }
}

/**
 * Reset manual do rate limit de um utilizador
 */
export async function resetRateLimit(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`ratelimit:${key}`);
}
