import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../../infrastructure/auth/GetCurrentUser';
import { GetConfigByKeyHandler } from '../../../../application/config/queries/GetConfigHandler';

interface Params {
  params: Promise<{ key: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { key } = await params;
  const sp = GetServiceProvider();
  const handler = new GetConfigByKeyHandler(sp.configRepository);
  const result = await handler.Handle({ key });

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.value);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  // Solo admin puede borrar configuración del sistema.
  const user = await GetCurrentUser();
  if (!user || user.rol !== 'admin') {
    return NextResponse.json(
      { error: 'No tienes permisos para borrar configuración' },
      { status: 403 },
    );
  }

  const { key } = await params;
  const sp = GetServiceProvider();
  const configResult = await sp.configRepository.GetByKey(key);

  if (configResult.isFailure) {
    return NextResponse.json({ error: configResult.error }, { status: 404 });
  }

  const deleteResult = await sp.configRepository.Delete(configResult.value!.id);

  if (deleteResult.isFailure) {
    return NextResponse.json({ error: deleteResult.error }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
