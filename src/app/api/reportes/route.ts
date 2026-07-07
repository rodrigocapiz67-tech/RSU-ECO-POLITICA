import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateReporteHandler } from '../../../application/reportes/commands/CreateReporteHandler';
import { CreateReporteCommand } from '../../../application/reportes/commands/CreateReporteCommand';
import { GetReportesHandler } from '../../../application/reportes/queries/GetReportesHandler';
import { CreateReporteSchema } from '../../../api/validations/ReporteSchema';
import { withErrorHandler } from '../../../api/middleware/withErrorHandler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const sp = GetServiceProvider();
  const handler = new GetReportesHandler(sp.reporteRepository);
  const result = await handler.Handle();

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  const parseResult = CreateReporteSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos', detalles: parseResult.error.format() },
      { status: 400 },
    );
  }

  const validData = parseResult.data;
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
});
