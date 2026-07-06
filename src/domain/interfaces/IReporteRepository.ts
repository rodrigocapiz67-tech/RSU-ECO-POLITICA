import { Reporte } from '../entities/Reporte';
import { Result } from '../common/Result';

export interface IReporteRepository {
  GetById(id: string): Promise<Result<Reporte>>;
  GetAll(): Promise<Result<Reporte[]>>;
  GetByAutor(autorId: string): Promise<Result<Reporte[]>>;
  Create(reporte: Reporte): Promise<Result<Reporte>>;
  Update(reporte: Reporte): Promise<Result<Reporte>>;
}
