import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../infrastructure/DependencyInjection';
import { GetCurrentUser } from '../../../infrastructure/auth/GetCurrentUser';
import { CreateConfigHandler } from '../../../application/config/commands/CreateConfigHandler';
import { CreateConfigCommand } from '../../../application/config/commands/CreateConfigCommand';
import { withErrorHandler } from '../../../api/middleware/withErrorHandler';
import { withRateLimitDistributed } from '../../../api/middleware/withRateLimitDistributed';
import { CreateConfigSchema } from '../../../api/validations/ConfigSchema';

export const GET = withErrorHandler(async () => {
  const sp = GetServiceProvider();
  const result = await sp.configRepository.GetAll();

  if (result.isFailure) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.value });
});

export const POST = withErrorHandler(withRateLimitDistributed(async (request: NextRequest) => {
  // Solo admin puede crear configuración del sistema.
  const user = await GetCurrentUser();
  if (!user || user.rol !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'No tienes permisos para crear configuración' },
      { status: 403 },
    );
  }

  const body = await request.json();
  const command: CreateConfigCommand = CreateConfigSchema.parse(body);

  const sp = GetServiceProvider();
  const handler = new CreateConfigHandler(sp.configRepository);
  const result = await handler.Handle(command);

  if (result.isFailure) {
    const status = result.error?.includes('already exists') ? 409 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json({ success: true, data: result.value }, { status: 201 });
}, { limit: 20, windowMs: 10 * 60 * 1000 }));
