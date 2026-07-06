import { IReporteRepository } from '../../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../../domain/entities/Reporte';
import { CategoriaReporte } from '../../../domain/enums/CategoriaReporte';
import { PrioridadReporte } from '../../../domain/enums/PrioridadReporte';
import { Result } from '../../../domain/common/Result';
import { CreateReporteCommand } from './CreateReporteCommand';

export class CreateReporteHandler {
  constructor(private readonly reporteRepository: IReporteRepository) {}

  async Handle(command: CreateReporteCommand): Promise<Result<Reporte>> {
    if (!Object.values(CategoriaReporte).includes(command.categoria as CategoriaReporte)) {
      return Result.Failure<Reporte>(`Categoría inválida: ${command.categoria}`);
    }

    const prioridad =
      (command.prioridad as PrioridadReporte) ?? PrioridadReporte.Media;
    if (!Object.values(PrioridadReporte).includes(prioridad)) {
      return Result.Failure<Reporte>(`Prioridad inválida: ${command.prioridad}`);
    }

    const reporte = Reporte.Create(
      command.titulo,
      command.descripcion,
      command.categoria as CategoriaReporte,
      command.ubicacion,
      prioridad,
      command.esAnonimo ?? false,
      command.fotoUrl,
      command.autorId,
    );

    return this.reporteRepository.Create(reporte);
  }
}
