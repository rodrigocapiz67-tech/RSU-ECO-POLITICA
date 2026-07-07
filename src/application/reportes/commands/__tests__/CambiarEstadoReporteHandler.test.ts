import { describe, expect, it, vi } from 'vitest';
import { IReporteRepository } from '../../../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../../../domain/entities/Reporte';
import { CategoriaReporte } from '../../../../domain/enums/CategoriaReporte';
import { PrioridadReporte } from '../../../../domain/enums/PrioridadReporte';
import { EstadoReporte } from '../../../../domain/enums/EstadoReporte';
import { Result } from '../../../../domain/common/Result';
import { CambiarEstadoReporteHandler } from '../CambiarEstadoReporteHandler';

const REPORTE_ID = 'reporte-1';

function makeReporte(): Reporte {
  return Reporte.Hydrate(
    REPORTE_ID,
    'Fuga de agua',
    'Hay una fuga en el pasillo B',
    CategoriaReporte.Agua,
    PrioridadReporte.Media,
    EstadoReporte.Enviado,
    'Pabellón B',
    false,
    undefined,
    'usuario-1',
  );
}

function makeRepository(reporte: Reporte | null): IReporteRepository {
  return {
    GetById: vi.fn(async () =>
      reporte ? Result.Success(reporte) : Result.Failure<Reporte>('Reporte no encontrado'),
    ),
    GetAll: vi.fn(),
    GetByAutor: vi.fn(),
    Create: vi.fn(),
    Update: vi.fn(async (r: Reporte) => Result.Success(r)),
  };
}

describe('CambiarEstadoReporteHandler', () => {
  it('rechaza un estado inválido', async () => {
    const repo = makeRepository(makeReporte());
    const handler = new CambiarEstadoReporteHandler(repo);

    const result = await handler.Handle({ reporteId: REPORTE_ID, nuevoEstado: 'estado-fantasma' });

    expect(result.isFailure).toBe(true);
    expect(repo.Update).not.toHaveBeenCalled();
  });

  it('falla si el reporte no existe', async () => {
    const repo = makeRepository(null);
    const handler = new CambiarEstadoReporteHandler(repo);

    const result = await handler.Handle({ reporteId: REPORTE_ID, nuevoEstado: EstadoReporte.EnProceso });

    expect(result.isFailure).toBe(true);
  });

  it('cambia el estado del reporte', async () => {
    const repo = makeRepository(makeReporte());
    const handler = new CambiarEstadoReporteHandler(repo);

    const result = await handler.Handle({ reporteId: REPORTE_ID, nuevoEstado: EstadoReporte.Resuelto });

    expect(result.isSuccess).toBe(true);
    expect(result.value?.estado).toBe(EstadoReporte.Resuelto);
    expect(repo.Update).toHaveBeenCalledTimes(1);
  });
});
