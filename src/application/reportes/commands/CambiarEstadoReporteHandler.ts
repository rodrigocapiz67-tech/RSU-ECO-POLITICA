import { IReporteRepository } from '../../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../../domain/entities/Reporte';
import { EstadoReporte } from '../../../domain/enums/EstadoReporte';
import { Result } from '../../../domain/common/Result';
import { CambiarEstadoReporteCommand } from './CambiarEstadoReporteCommand';

export class CambiarEstadoReporteHandler {
  constructor(private readonly reporteRepository: IReporteRepository) {}

  async Handle(command: CambiarEstadoReporteCommand): Promise<Result<Reporte>> {
    if (!Object.values(EstadoReporte).includes(command.nuevoEstado as EstadoReporte)) {
      return Result.Failure<Reporte>(`Estado inválido: ${command.nuevoEstado}`);
    }

    const reporteResult = await this.reporteRepository.GetById(command.reporteId);
    if (reporteResult.isFailure) {
      return Result.Failure<Reporte>(reporteResult.error ?? 'Reporte no encontrado');
    }

    const reporte = reporteResult.value!;
    reporte.CambiarEstado(command.nuevoEstado as EstadoReporte);

    return this.reporteRepository.Update(reporte);
  }
}
