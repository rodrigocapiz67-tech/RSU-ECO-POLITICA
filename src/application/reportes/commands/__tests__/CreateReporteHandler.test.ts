import { describe, expect, it, vi } from 'vitest';
import { IReporteRepository } from '../../../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../../../domain/entities/Reporte';
import { Result } from '../../../../domain/common/Result';
import { CreateReporteHandler } from '../CreateReporteHandler';
import { CreateReporteCommand } from '../CreateReporteCommand';

function makeCommand(overrides: Partial<CreateReporteCommand> = {}): CreateReporteCommand {
  return {
    titulo: 'Fuga de agua',
    descripcion: 'Hay una fuga en el pasillo B',
    categoria: 'agua',
    ubicacion: 'Pabellón B',
    ...overrides,
  };
}

function makeRepository(): IReporteRepository {
  return {
    GetById: vi.fn(),
    GetAll: vi.fn(),
    GetByAutor: vi.fn(),
    Create: vi.fn(async (reporte: Reporte) => Result.Success(reporte)),
    Update: vi.fn(),
  };
}

describe('CreateReporteHandler', () => {
  it('rechaza una categoría inválida', async () => {
    const repo = makeRepository();
    const handler = new CreateReporteHandler(repo);

    const result = await handler.Handle(makeCommand({ categoria: 'no-existe' }));

    expect(result.isFailure).toBe(true);
    expect(repo.Create).not.toHaveBeenCalled();
  });

  it('rechaza una prioridad inválida', async () => {
    const repo = makeRepository();
    const handler = new CreateReporteHandler(repo);

    const result = await handler.Handle(makeCommand({ prioridad: 'urgentisimo' }));

    expect(result.isFailure).toBe(true);
    expect(repo.Create).not.toHaveBeenCalled();
  });

  it('usa prioridad media por defecto cuando no se especifica', async () => {
    const repo = makeRepository();
    const handler = new CreateReporteHandler(repo);

    const result = await handler.Handle(makeCommand());

    expect(result.isSuccess).toBe(true);
    expect(result.value?.prioridad).toBe('media');
  });

  it('crea el reporte con los datos provistos', async () => {
    const repo = makeRepository();
    const handler = new CreateReporteHandler(repo);

    const result = await handler.Handle(makeCommand({ esAnonimo: true, autorId: undefined }));

    expect(result.isSuccess).toBe(true);
    expect(result.value?.esAnonimo).toBe(true);
    expect(result.value?.autorId).toBeUndefined();
    expect(repo.Create).toHaveBeenCalledTimes(1);
  });
});
