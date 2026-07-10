import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../../infrastructure/auth/GetCurrentUser';
import { GetReporteByIdHandler } from '../../../../application/reportes/queries/GetReportesHandler';
import { CambiarEstadoReporteHandler } from '../../../../application/reportes/commands/CambiarEstadoReporteHandler';
import { canTransition } from '../../../../domain/workflows/ReporteStateTransitions';
import { EstadoReporte } from '../../../../domain/enums/EstadoReporte';

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

// PATCH: cambio de estado del reporte (staff/admin) con validación de workflow.
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

  // Validar que nuevoEstado es un enum válido
  if (!Object.values(EstadoReporte).includes(body.nuevoEstado as EstadoReporte)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const sp = GetServiceProvider();

  // 1. Obtener reporte actual para validar transición
  const getHandler = new GetReporteByIdHandler(sp.reporteRepository);
  const getResult = await getHandler.Handle({ id });

  if (getResult.isFailure) {
    return NextResponse.json({ error: getResult.error }, { status: 404 });
  }

  const reporteActual = getResult.value!;
  const isAdmin = user.rol === 'admin';

  // 2. Validar que la transición es permitida según el workflow
  if (!canTransition(reporteActual.estado as EstadoReporte, body.nuevoEstado, isAdmin)) {
    const mensaje = isAdmin
      ? `Transición no válida: ${reporteActual.estado} → ${body.nuevoEstado}`
      : `Coordinators solo pueden avanzar el reporte (${reporteActual.estado} no puede ir a ${body.nuevoEstado})`;
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  // 3. Proceder con el cambio de estado
  const handler = new CambiarEstadoReporteHandler(sp.reporteRepository);
  const result = await handler.Handle({ reporteId: id, nuevoEstado: body.nuevoEstado });

  if (result.isFailure) {
    const status = result.error?.includes('no encontrado') ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.value);
}
