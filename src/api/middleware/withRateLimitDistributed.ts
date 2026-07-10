import { NextRequest, NextResponse } from 'next/server';
import type { ApiHandler } from './withErrorHandler';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Rate limiter distribuido que soporta múltiples instancias (Vercel).
 * Usa Upstash Redis si está configurado; fallback a en-memoria (solo desarrollo).
 */
export function withRateLimitDistributed(
  handler: ApiHandler,
  options: RateLimitOptions,
): ApiHandler {
  // Inicializar cliente Redis si está disponible
  let redisUrl: string | null = null;
  let redisToken: string | null = null;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  // Fallback en-memoria para desarrollo
  const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>();
  const MAX_BUCKETS = 5_000;

  return async (req: NextRequest, context: any) => {
    const now = Date.now();
    const key = `ratelimit:${req.nextUrl.pathname}:${getClientKey(req)}`;

    try {
      if (redisUrl && redisToken) {
        // Usar Redis para rate limiting distribuido
        const response = await fetch(`${redisUrl}/incr/${key}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
          },
        });

        if (!response.ok) {
          // Si Redis falla, permitir (fallback permisivo)
          return handler(req, context);
        }

        const data = (await response.json()) as { result: number };
        const count = data.result;

        // Primera solicitud: establecer TTL
        if (count === 1) {
          await fetch(`${redisUrl}/expire/${key}/${Math.ceil(options.windowMs / 1000)}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${redisToken}`,
            },
          });
        }

        if (count > options.limit) {
          const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
          return NextResponse.json(
            { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
            { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
          );
        }
      } else {
        // Fallback en-memoria (solo válido para desarrollo/single instance)
        const bucket = inMemoryBuckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
          inMemoryBuckets.delete(key);
          if (inMemoryBuckets.size >= MAX_BUCKETS) {
            const oldestKey = inMemoryBuckets.keys().next().value;
            if (oldestKey !== undefined) inMemoryBuckets.delete(oldestKey);
          }
          inMemoryBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
        } else {
          bucket.count += 1;
          if (bucket.count > options.limit) {
            const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
            return NextResponse.json(
              { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
              { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
            );
          }
        }
      }

      return handler(req, context);
    } catch {
      // Cualquier error: permitir solicitud (fail-open para disponibilidad)
      return handler(req, context);
    }
  };
}
