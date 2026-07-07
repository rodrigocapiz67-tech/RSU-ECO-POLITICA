import { Reporte } from '../entities/Reporte';
import { Result } from '../common/Result';
import { PaginatedResult, PaginationParams } from '../common/Pagination';

export interface IReporteRepository {
  GetById(id: string): Promise<Result<Reporte>>;
  GetAll(pagination: PaginationParams): Promise<Result<PaginatedResult<Reporte>>>;
  GetByAutor(autorId: string): Promise<Result<Reporte[]>>;
  Create(reporte: Reporte): Promise<Result<Reporte>>;
  Update(reporte: Reporte): Promise<Result<Reporte>>;
}
