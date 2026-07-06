import { IActividadRepository } from '../../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../../domain/entities/Actividad';
import { Result } from '../../../domain/common/Result';
import { CreateActividadCommand } from './CreateActividadCommand';

export class CreateActividadHandler {
  constructor(private readonly actividadRepository: IActividadRepository) {}

  async Handle(command: CreateActividadCommand): Promise<Result<Actividad>> {
    const fecha = new Date(command.fecha);
    if (Number.isNaN(fecha.getTime())) {
      return Result.Failure<Actividad>('La fecha de la actividad no es válida');
    }

    if (command.cupoMaximo <= 0) {
      return Result.Failure<Actividad>('El cupo máximo debe ser mayor a 0');
    }

    const actividad = Actividad.Create(
      command.titulo,
      command.descripcion,
      fecha,
      command.ubicacion,
      command.cupoMaximo,
      command.organizadorId,
    );

    return this.actividadRepository.Create(actividad);
  }
}
