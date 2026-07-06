import { Actividad } from '../entities/Actividad';
import { Result } from '../common/Result';

export interface IActividadRepository {
  GetById(id: string): Promise<Result<Actividad>>;
  GetAll(): Promise<Result<Actividad[]>>;
  GetProximas(): Promise<Result<Actividad[]>>;
  Create(actividad: Actividad): Promise<Result<Actividad>>;
}
