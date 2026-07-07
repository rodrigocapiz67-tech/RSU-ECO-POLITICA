import { Actividad } from '../entities/Actividad';
import { Result } from '../common/Result';
import { PaginatedResult, PaginationParams } from '../common/Pagination';

export interface IActividadRepository {
  GetById(id: string): Promise<Result<Actividad>>;
  GetProximas(pagination: PaginationParams): Promise<Result<PaginatedResult<Actividad>>>;
  Create(actividad: Actividad): Promise<Result<Actividad>>;
}
