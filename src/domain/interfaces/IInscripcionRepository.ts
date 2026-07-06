import { Inscripcion } from '../entities/Inscripcion';
import { Result } from '../common/Result';

export interface IInscripcionRepository {
  Create(inscripcion: Inscripcion): Promise<Result<Inscripcion>>;
  Delete(id: string): Promise<Result<void>>;
  ExisteInscripcion(actividadId: string, usuarioId: string): Promise<Result<boolean>>;
  ContarPorActividad(actividadId: string): Promise<Result<number>>;
  GetByUsuario(usuarioId: string): Promise<Result<Inscripcion[]>>;
}
