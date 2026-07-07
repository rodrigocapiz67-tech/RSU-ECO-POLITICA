import { NextRequest, NextResponse } from 'next/server';
import type { ApiHandler } from './withErrorHandler';

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
 * Estado en memoria del proceso. LIMITACIONES:
 * 1) En despliegues serverless multi-instancia (p. ej. Vercel) el límite
 *    aplica por instancia, no de forma global.
 * 2) `x-forwarded-for` solo es confiable si la plataforma de despliegue lo
 *    sobrescribe con la IP real del cliente (Vercel lo hace; un `next start`
 *    plano detrás de un proxy propio puede no hacerlo, y entonces un cliente
 *    podría spoofearlo para evadir el límite).
 * Suficiente para mitigar spam básico en un MVP; para un límite estrictamente
 * global y a prueba de spoofing se necesita un store compartido detrás de un
 * proxy confiable (Upstash Redis, etc.).
 */
const buckets = new Map<string, Bucket>();

/** Cota dura de memoria: Map preserva orden de inserción, así que el primer key es siempre el más antiguo. */
const MAX_BUCKETS = 5_000;

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Limitador de tasa por IP + ruta. Devuelve 429 con `Retry-After` cuando
 * se excede el límite dentro de la ventana configurada.
 */
export function withRateLimit(handler: ApiHandler, options: RateLimitOptions): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const now = Date.now();
    const key = `${req.nextUrl.pathname}:${getClientKey(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      // `delete` antes de re-chequear el tamaño: si `key` ya existía (ventana
      // expirada), no cuenta como crecimiento del Map y no evictamos a nadie
      // ajeno. Solo se evict el bucket más antiguo cuando insertar esta key
      // realmente haría crecer el Map más allá de la cota.
      buckets.delete(key);
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) buckets.delete(oldestKey);
      }
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
