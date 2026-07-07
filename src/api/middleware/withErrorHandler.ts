import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logging/Logger';

/**
 * Tipo para los manejadores de rutas (Route Handlers) en Next.js
 */
export type ApiHandler = (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper Global de Errores (Higher-Order Function).
 * Atrapa cualquier excepción no controlada en los endpoints y asegura que el 
 * cliente SIEMPRE reciba un JSON estandarizado, evitando fugas de información.
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    try {
      // Ejecutar la lógica real del endpoint
      return await handler(req, context);
      
    } catch (error: any) {
      // 1. Loggear el error detallado internamente (servidor)
      logger.error('Unhandled API error', error, {
        method: req.method,
        path: req.nextUrl.pathname,
      });

      // 2. Body JSON malformado (request.json() lanza SyntaxError): es un error de input del cliente, no del servidor.
      if (error instanceof SyntaxError) {
        const message = 'El cuerpo de la petición no es JSON válido';
        return NextResponse.json(
          {
            success: false,
            status: 400,
            error: message,
            message,
            errorCode: 'INVALID_JSON',
          },
          { status: 400 }
        );
      }

      // 3. Manejar Errores de Validación (Zod) que hayan escapado
      if (error instanceof ZodError) {
        const message = 'Error de validación de formato';
        return NextResponse.json(
          {
            success: false,
            status: 400,
            error: message,
            message,
            errorCode: 'VALIDATION_ERROR',
            detalles: error.format(),
          },
          { status: 400 }
        );
      }

      // 4. Manejar Errores Genéricos / Caídas de Base de Datos
      const statusCode = error.status || 500;
      const isInternal = statusCode === 500;
      const message = isInternal
        ? 'Ha ocurrido un error inesperado en el servidor. El equipo técnico ha sido notificado.'
        : error.message;

      return NextResponse.json(
        {
          success: false,
          status: statusCode,
          error: message,
          message,
          errorCode: error.code || 'INTERNAL_SERVER_ERROR',
        },
        { status: statusCode }
      );
    }
  };
}
