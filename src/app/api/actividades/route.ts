import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateActividadHandler } from '../../../application/actividades/commands/CreateActividadHandler';
import { CreateActividadCommand } from '../../../application/actividades/commands/CreateActividadCommand';
import { GetActividadesHandler } from '../../../application/actividades/queries/GetActividadesHandler';
import { withErrorHandler } from '../../../api/middleware/withErrorHandler';
import { CreateActividadSchema } from '../../../api/validations/ActividadSchema';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const page = Number(request.nextUrl.searchParams.get('page'));
  const pageSize = Number(request.nextUrl.searchParams.get('pageSize'));

  const sp = GetServiceProvider();
  const handler = new GetActividadesHandler(sp.actividadRepository);
  const result = await handler.Handle({ page, pageSize });

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Solo coordinadores/admin pueden crear actividades.
  const user = await GetCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }
  if (user.rol !== 'coordinador' && user.rol !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'No tienes permisos para crear actividades' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const validData = CreateActividadSchema.parse(body);

  const command: CreateActividadCommand = {
    titulo: validData.titulo,
    descripcion: validData.descripcion,
    fecha: validData.fecha,
    ubicacion: validData.ubicacion,
    cupoMaximo: validData.cupoMaximo,
    organizadorId: user.id,
  };

  const sp = GetServiceProvider();
  const handler = new CreateActividadHandler(sp.actividadRepository);
  const result = await handler.Handle(command);

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value }, { status: 201 });
});
