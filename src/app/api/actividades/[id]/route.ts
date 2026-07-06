import { NextRequest, NextResponse } from 'next/server';
import { GetServiceProvider } from '../../../../infrastructure/DependencyInjection';
import { GetActividadByIdHandler } from '../../../../application/actividades/queries/GetActividadesHandler';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sp = GetServiceProvider();
  const handler = new GetActividadByIdHandler(sp.actividadRepository);
  const result = await handler.Handle({ id });

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.value);
}
