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
    // 1. La actividad debe existir.
    const actividadResult = await this.actividadRepository.GetById(command.actividadId);
    if (actividadResult.isFailure) {
      return Result.Failure<Inscripcion>(actividadResult.error ?? 'Actividad no encontrada');
    }
    const actividad = actividadResult.value!;

    // 2. Evitar inscripción duplicada.
    const yaInscrito = await this.inscripcionRepository.ExisteInscripcion(
      command.actividadId,
      command.usuarioId,
    );
    if (yaInscrito.isSuccess && yaInscrito.value) {
      return Result.Failure<Inscripcion>('El usuario ya está inscrito en esta actividad');
    }

    // 3. Control de cupo.
    const conteo = await this.inscripcionRepository.ContarPorActividad(command.actividadId);
    if (conteo.isFailure) {
      return Result.Failure<Inscripcion>(conteo.error ?? 'No se pudo verificar el cupo');
    }
    if (!actividad.TieneCupo(conteo.value!)) {
      return Result.Failure<Inscripcion>('La actividad ya alcanzó su cupo máximo');
    }

    // 4. Registrar inscripción.
    const inscripcion = Inscripcion.Create(command.actividadId, command.usuarioId);
    return this.inscripcionRepository.Create(inscripcion);
  }
}
