import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

interface RateLimitOptions {
  /** Máximo de requests permitidos dentro de la ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Estado en memoria del proceso. LIMITACIÓN: en despliegues serverless
 * multi-instancia (p. ej. Vercel) el límite aplica por instancia, no de
 * forma global. Suficiente para mitigar spam básico en un MVP; para un
 * límite estrictamente global se necesita un store compartido (Upstash
 * Redis, etc.).
 */
const buckets = new Map<string, Bucket>();

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function pruneExpired(now: number): void {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Limitador de tasa por IP + ruta. Devuelve 429 con `Retry-After` cuando
 * se excede el límite dentro de la ventana configurada.
 */
export function withRateLimit(handler: ApiHandler, options: RateLimitOptions): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const now = Date.now();
    pruneExpired(now);

    const key = `${req.nextUrl.pathname}:${getClientKey(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
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

    return handler(req, context);
  };
}
