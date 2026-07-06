import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateReporteHandler } from '../../../application/reportes/commands/CreateReporteHandler';
import { CreateReporteCommand } from '../../../application/reportes/commands/CreateReporteCommand';
import { GetReportesHandler } from '../../../application/reportes/queries/GetReportesHandler';

export async function GET() {
  const sp = GetServiceProvider();
  const handler = new GetReportesHandler(sp.reporteRepository);
  const result = await handler.Handle();

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.value);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.titulo || !body.descripcion || !body.categoria || !body.ubicacion) {
    return NextResponse.json(
      { error: 'titulo, descripcion, categoria y ubicacion son obligatorios' },
      { status: 400 },
    );
  }

  const esAnonimo = body.esAnonimo ?? false;

  // Reporte identificado ⇒ requiere sesión. Reporte anónimo ⇒ sin autor.
  const user = await GetCurrentUser();
  if (!esAnonimo && !user) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión o marcar el reporte como anónimo' },
      { status: 401 },
    );
  }

  const command: CreateReporteCommand = {
    titulo: body.titulo,
    descripcion: body.descripcion,
    categoria: body.categoria,
    ubicacion: body.ubicacion,
    prioridad: body.prioridad,
    esAnonimo,
    fotoUrl: body.fotoUrl,
    autorId: esAnonimo ? undefined : user?.id,
  };

  const sp = GetServiceProvider();
  const handler = new CreateReporteHandler(sp.reporteRepository);
  const result = await handler.Handle(command);

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.value, { status: 201 });
}
