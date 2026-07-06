import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateConfigHandler } from '../../../application/config/commands/CreateConfigHandler';
import { CreateConfigCommand } from '../../../application/config/commands/CreateConfigCommand';

export async function GET() {
  const sp = GetServiceProvider();
  const result = await sp.configRepository.GetAll();

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.value);
}

export async function POST(request: NextRequest) {
  // Solo admin puede crear configuración del sistema.
  const user = await GetCurrentUser();
  if (!user || user.rol !== 'admin') {
    return NextResponse.json(
      { error: 'No tienes permisos para crear configuración' },
      { status: 403 },
    );
  }

  const body: CreateConfigCommand = await request.json();

  if (!body.key || !body.value) {
    return NextResponse.json(
      { error: 'key and value are required' },
      { status: 400 },
    );
  }

  const sp = GetServiceProvider();
  const handler = new CreateConfigHandler(sp.configRepository);
  const result = await handler.Handle(body);

  if (result.isFailure) {
    const status = result.error?.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.value, { status: 201 });
}
