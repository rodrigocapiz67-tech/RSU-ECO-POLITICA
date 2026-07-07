import { describe, expect, it, vi } from 'vitest';
import { IActividadRepository } from '../../../../domain/interfaces/IActividadRepository';
import { IInscripcionRepository } from '../../../../domain/interfaces/IInscripcionRepository';
import { Actividad } from '../../../../domain/entities/Actividad';
import { Inscripcion } from '../../../../domain/entities/Inscripcion';
import { Result } from '../../../../domain/common/Result';
import { InscribirUsuarioHandler } from '../InscribirUsuarioHandler';

const ACTIVIDAD_ID = 'actividad-1';
const USUARIO_ID = 'usuario-1';

function makeActividad(cupoMaximo = 2): Actividad {
  return Actividad.Hydrate(
    ACTIVIDAD_ID,
    'Reforestación',
    'Plantar árboles',
    new Date('2026-09-01'),
    'Parque Central',
    cupoMaximo,
    'organizador-1',
  );
}

function makeActividadRepository(actividad: Actividad | null): IActividadRepository {
  return {
    GetById: vi.fn(async () =>
      actividad ? Result.Success(actividad) : Result.Failure<Actividad>('Actividad no encontrada'),
    ),
    GetAll: vi.fn(),
    GetProximas: vi.fn(),
    Create: vi.fn(),
  };
}

function makeInscripcionRepository(overrides: Partial<IInscripcionRepository> = {}): IInscripcionRepository {
  return {
    Create: vi.fn(async (inscripcion: Inscripcion) => Result.Success(inscripcion)),
    Delete: vi.fn(),
    ExisteInscripcion: vi.fn(async () => Result.Success(false)),
    ContarPorActividad: vi.fn(async () => Result.Success(0)),
    GetByUsuario: vi.fn(),
    ...overrides,
  };
}

describe('InscribirUsuarioHandler', () => {
  it('falla si la actividad no existe', async () => {
    const handler = new InscribirUsuarioHandler(makeActividadRepository(null), makeInscripcionRepository());

    const result = await handler.Handle({ actividadId: ACTIVIDAD_ID, usuarioId: USUARIO_ID });

    expect(result.isFailure).toBe(true);
  });

  it('falla si el usuario ya está inscrito', async () => {
    const inscripcionRepo = makeInscripcionRepository({
      ExisteInscripcion: vi.fn(async () => Result.Success(true)),
    });
    const handler = new InscribirUsuarioHandler(makeActividadRepository(makeActividad()), inscripcionRepo);

    const result = await handler.Handle({ actividadId: ACTIVIDAD_ID, usuarioId: USUARIO_ID });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('ya está');
  });

  it('falla si la actividad alcanzó el cupo máximo', async () => {
    const inscripcionRepo = makeInscripcionRepository({
      ContarPorActividad: vi.fn(async () => Result.Success(2)),
    });
    const handler = new InscribirUsuarioHandler(makeActividadRepository(makeActividad(2)), inscripcionRepo);

    const result = await handler.Handle({ actividadId: ACTIVIDAD_ID, usuarioId: USUARIO_ID });

    expect(result.isFailure).toBe(true);
    expect(result.error).toContain('cupo');
  });

  it('inscribe al usuario cuando hay cupo disponible', async () => {
    const inscripcionRepo = makeInscripcionRepository({
      ContarPorActividad: vi.fn(async () => Result.Success(1)),
    });
    const handler = new InscribirUsuarioHandler(makeActividadRepository(makeActividad(2)), inscripcionRepo);

    const result = await handler.Handle({ actividadId: ACTIVIDAD_ID, usuarioId: USUARIO_ID });

    expect(result.isSuccess).toBe(true);
    expect(inscripcionRepo.Create).toHaveBeenCalledTimes(1);
  });
});
