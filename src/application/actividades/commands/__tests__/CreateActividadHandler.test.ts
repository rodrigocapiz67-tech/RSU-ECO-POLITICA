import { describe, expect, it, vi } from 'vitest';
import { IActividadRepository } from '../../../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../../../domain/entities/Actividad';
import { Result } from '../../../../domain/common/Result';
import { CreateActividadHandler } from '../CreateActividadHandler';
import { CreateActividadCommand } from '../CreateActividadCommand';

function makeCommand(overrides: Partial<CreateActividadCommand> = {}): CreateActividadCommand {
  return {
    titulo: 'Limpieza de playa',
    descripcion: 'Jornada de limpieza',
    fecha: '2026-08-01T10:00:00.000Z',
    ubicacion: 'Costa Verde',
    cupoMaximo: 30,
    organizadorId: 'organizador-1',
    ...overrides,
  };
}

function makeRepository(): IActividadRepository {
  return {
    GetById: vi.fn(),
    GetProximas: vi.fn(),
    Create: vi.fn(async (actividad: Actividad) => Result.Success(actividad)),
  };
}

describe('CreateActividadHandler', () => {
  it('rechaza una fecha inválida', async () => {
    const repo = makeRepository();
    const handler = new CreateActividadHandler(repo);

    const result = await handler.Handle(makeCommand({ fecha: 'no-es-una-fecha' }));

    expect(result.isFailure).toBe(true);
    expect(repo.Create).not.toHaveBeenCalled();
  });

  it('rechaza un cupo máximo menor o igual a 0', async () => {
    const repo = makeRepository();
    const handler = new CreateActividadHandler(repo);

    const result = await handler.Handle(makeCommand({ cupoMaximo: 0 }));

    expect(result.isFailure).toBe(true);
    expect(repo.Create).not.toHaveBeenCalled();
  });

  it('crea la actividad cuando los datos son válidos', async () => {
    const repo = makeRepository();
    const handler = new CreateActividadHandler(repo);

    const result = await handler.Handle(makeCommand());

    expect(result.isSuccess).toBe(true);
    expect(result.value?.titulo).toBe('Limpieza de playa');
    expect(result.value?.organizadorId).toBe('organizador-1');
    expect(repo.Create).toHaveBeenCalledTimes(1);
  });
});
