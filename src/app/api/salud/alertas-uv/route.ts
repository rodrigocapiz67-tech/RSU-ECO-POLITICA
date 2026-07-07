import { NextResponse } from 'next/server';

/**
 * GET /api/salud/alertas-uv
 * Endpoint para manejar Alertas UV de acuerdo al lineamiento de Sostenibilidad.
 * Emite alertas entre 10:00 a.m. y 3:00 p.m. y retorna el disclaimer legal obligatorio.
 */
export async function GET() {
  try {
    // 1. Obtener la hora actual en la zona horaria del proyecto (Lima/Perú)
    const timeOptions: Intl.DateTimeFormatOptions = { 
      timeZone: 'America/Lima', 
      hour: 'numeric', 
      hour12: false 
    };
    
    const formatter = new Intl.DateTimeFormat('es-PE', timeOptions);
    const currentHourStr = formatter.format(new Date());
    const currentHour = parseInt(currentHourStr, 10);

    // 2. Lógica de Riesgo (10:00 a.m. a 3:00 p.m. = 15:00)
    const isCriticalRisk = currentHour >= 10 && currentHour < 15;

    // 3. Payload de Respuesta con Cumplimiento Legal
    const payload = {
      timestamp: new Date().toISOString(),
      alerta_activa: isCriticalRisk,
      nivel_riesgo: isCriticalRisk ? 'CRÍTICO' : 'MODERADO',
      recomendacion: isCriticalRisk 
        ? '⚠️ Riesgo Extremo. Se recomienda suspender actividades al aire libre o buscar sombra.'
        : 'Condiciones seguras. Sin embargo, mantenga precauciones normales.',
      
      // CUMPLIMIENTO LEGAL OBLIGATORIO
      disclaimer_legal: "La exposición prolongada a la radiación solar produce daño a la salud."
    };

    return NextResponse.json(payload, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando la alerta UV' }, 
      { status: 500 }
    );
  }
}
