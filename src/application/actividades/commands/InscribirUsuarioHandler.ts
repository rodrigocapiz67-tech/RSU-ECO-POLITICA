import { IActividadRepository } from '../../../domain/interfaces/IActividadRepository';
import { IInscripcionRepository } from '../../../domain/interfaces/IInscripcionRepository';
import { Inscripcion } from '../../../domain/entities/Inscripcion';
import { Result } from '../../../domain/common/Result';
import { InscribirUsuarioCommand } from './InscribirUsuarioCommand';

export class InscribirUsuarioHandler {
  constructor(
    private readonly actividadRepository: IActividadRepository,
    private readonly inscripcionRepository: IInscripcionRepository,
  ) {}

  async Handle(command: InscribirUsuarioCommand): Promise<Result<Inscripcion>> {
    // Validaciones básicas: actividad debe existir y no estar en el pasado
    const actividadResult = await this.actividadRepository.GetById(command.actividadId);
    if (actividadResult.isFailure) {
      return Result.Failure<Inscripcion>(actividadResult.error ?? 'Actividad no encontrada');
    }
    const actividad = actividadResult.value!;

    // Validar que actividad no esté en el pasado
    if (actividad.fecha < new Date()) {
      return Result.Failure<Inscripcion>('No puedes inscribirse a una actividad que ya ha ocurrido');
    }

    // Todas las validaciones de cupo, duplicados y conteo se hacen de forma
    // ATÓMICA en el RPC inscribir_en_actividad() con advisory locks.
    const inscripcion = Inscripcion.Create(command.actividadId, command.usuarioId);
    return this.inscripcionRepository.Create(inscripcion);
  }
}
