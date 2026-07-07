import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Tipo para los manejadores de rutas (Route Handlers) en Next.js
 */
type ApiHandler = (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

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
      console.error(`❌ [API Error] ${req.method} ${req.nextUrl.pathname}:`, error);

      // 2. Manejar Errores de Validación (Zod) que hayan escapado
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            status: 400,
            message: 'Error de validación de formato',
            errorCode: 'VALIDATION_ERROR',
            detalles: error.format(),
          },
          { status: 400 }
        );
      }

      // 3. Manejar Errores Genéricos / Caídas de Base de Datos
      const statusCode = error.status || 500;
      const isInternal = statusCode === 500;

      return NextResponse.json(
        {
          success: false,
          status: statusCode,
          message: isInternal 
            ? 'Ha ocurrido un error inesperado en el servidor. El equipo técnico ha sido notificado.' 
            : error.message,
          errorCode: error.code || 'INTERNAL_SERVER_ERROR',
        },
        { status: statusCode }
      );
    }
  };
}
