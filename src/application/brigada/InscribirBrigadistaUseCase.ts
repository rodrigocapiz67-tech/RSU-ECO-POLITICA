import { IBrigadistaRepository, InscripcionBrigadistaResult } from '../../domain/interfaces/IBrigadistaRepository';
import { Result } from '../../domain/common/Result';
import { GetServiceProvider } from '../../infrastructure/DependencyInjection';

export class InscribirBrigadistaUseCase {
  private brigadistaRepository: IBrigadistaRepository;

  constructor() {
    this.brigadistaRepository = GetServiceProvider().brigadistaRepository;
  }

  /**
   * Ejecuta la validación e inscripción de un estudiante a la Brigada Ambiental.
   * Delega la responsabilidad de concurrencia (evitar > 90 inscritos al mismo tiempo)
   * a la función RPC de PostgreSQL.
   */
  async execute(usuarioId: string): Promise<Result<InscripcionBrigadistaResult>> {
    if (!usuarioId) {
      return Result.Failure('El ID del usuario es requerido para la inscripción.');
    }

    return await this.brigadistaRepository.Inscribir(usuarioId);
  }
}
