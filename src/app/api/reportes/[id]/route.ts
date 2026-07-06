import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../../infrastructure/auth/GetCurrentUser';
import { GetReporteByIdHandler } from '../../../../application/reportes/queries/GetReportesHandler';
import { CambiarEstadoReporteHandler } from '../../../../application/reportes/commands/CambiarEstadoReporteHandler';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sp = GetServiceProvider();
  const handler = new GetReporteByIdHandler(sp.reporteRepository);
  const result = await handler.Handle({ id });

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.value);
}

// PATCH: cambio de estado del reporte (staff/admin).
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await GetCurrentUser();
  if (!user || (user.rol !== 'coordinador' && user.rol !== 'admin')) {
    return NextResponse.json(
      { error: 'No tienes permisos para cambiar el estado del reporte' },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.nuevoEstado) {
    return NextResponse.json({ error: 'nuevoEstado es obligatorio' }, { status: 400 });
  }

  const sp = GetServiceProvider();
  const handler = new CambiarEstadoReporteHandler(sp.reporteRepository);
  const result = await handler.Handle({ reporteId: id, nuevoEstado: body.nuevoEstado });

  if (result.isFailure) {
    const status = result.error?.includes('no encontrado') ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.value);
}
