import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../../../infrastructure/auth/GetCurrentUser';
import { InscribirUsuarioHandler } from '../../../../../application/actividades/commands/InscribirUsuarioHandler';
import { withRateLimit } from '../../../../../api/middleware/withRateLimit';
import { withErrorHandler } from '../../../../../api/middleware/withErrorHandler';

interface Params {
  params: Promise<{ id: string }>;
}

async function HandlePost(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const user = await GetCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const sp = GetServiceProvider();
  const handler = new InscribirUsuarioHandler(
    sp.actividadRepository,
    sp.inscripcionRepository,
  );
  const result = await handler.Handle({ actividadId: id, usuarioId: user.id });

  if (result.isFailure) {
    const status =
      result.error?.includes('cupo') || result.error?.includes('ya está') ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.value, { status: 201 });
}

export const POST = withErrorHandler(withRateLimit(HandlePost, { limit: 10, windowMs: 10 * 60 * 1000 }));
