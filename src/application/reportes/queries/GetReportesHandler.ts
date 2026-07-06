import { IReporteRepository } from '../../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../../domain/entities/Reporte';
import { Result } from '../../../domain/common/Result';
import { GetReporteByIdQuery, GetReportesByAutorQuery } from './GetReportesQuery';

export class GetReportesHandler {
  constructor(private readonly reporteRepository: IReporteRepository) {}

  async Handle(): Promise<Result<Reporte[]>> {
    return this.reporteRepository.GetAll();
  }
}

export class GetReporteByIdHandler {
  constructor(private readonly reporteRepository: IReporteRepository) {}

  async Handle(query: GetReporteByIdQuery): Promise<Result<Reporte>> {
    return this.reporteRepository.GetById(query.id);
  }
}

export class GetReportesByAutorHandler {
  constructor(private readonly reporteRepository: IReporteRepository) {}

  async Handle(query: GetReportesByAutorQuery): Promise<Result<Reporte[]>> {
    return this.reporteRepository.GetByAutor(query.autorId);
  }
}
