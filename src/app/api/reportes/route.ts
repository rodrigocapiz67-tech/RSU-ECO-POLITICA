import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateReporteHandler } from '../../../application/reportes/commands/CreateReporteHandler';
import { CreateReporteCommand } from '../../../application/reportes/commands/CreateReporteCommand';
import { GetReportesHandler } from '../../../application/reportes/queries/GetReportesHandler';
import { CreateReporteSchema } from '../../../api/validations/ReporteSchema';
import { withErrorHandler } from '../../../api/middleware/withErrorHandler';
import { withRateLimit } from '../../../api/middleware/withRateLimit';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const page = Number(request.nextUrl.searchParams.get('page'));
  const pageSize = Number(request.nextUrl.searchParams.get('pageSize'));

  const sp = GetServiceProvider();
  const handler = new GetReportesHandler(sp.reporteRepository);
  const result = await handler.Handle({ page, pageSize });

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value });
});

export const POST = withErrorHandler(withRateLimit(async (request: NextRequest) => {
  const body = await request.json();
  const validData = CreateReporteSchema.parse(body);
  const esAnonimo = validData.esAnonimo;

  // Reporte identificado ⇒ requiere sesión. Reporte anónimo ⇒ sin autor.
  const user = await GetCurrentUser();
  if (!esAnonimo && !user) {
    return NextResponse.json(
      { success: false, error: 'Debes iniciar sesión o marcar el reporte como anónimo' },
      { status: 401 },
    );
  }

  const command: CreateReporteCommand = {
    titulo: validData.titulo,
    descripcion: validData.descripcion,
    categoria: validData.categoria,
    ubicacion: validData.ubicacion,
    prioridad: validData.prioridad,
    esAnonimo,
    fotoUrl: validData.fotoUrl,
    autorId: esAnonimo ? undefined : user?.id,
  };

  const sp = GetServiceProvider();
  const handler = new CreateReporteHandler(sp.reporteRepository);
  const result = await handler.Handle(command);

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value }, { status: 201 });
}, { limit: 5, windowMs: 10 * 60 * 1000 }));
