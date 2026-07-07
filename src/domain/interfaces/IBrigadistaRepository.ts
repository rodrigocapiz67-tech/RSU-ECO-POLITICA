import { Result } from '../common/Result';

export interface InscribirBrigadistaResponse {
  success: boolean;
  message?: string;
  error?: string;
  cupos_restantes?: number;
}

export interface IBrigadistaRepository {
  /**
   * Intenta inscribir a un usuario en la brigada ambiental.
   * Utiliza una transacción RPC en base de datos para prevenir race conditions
   * y respetar el límite de 90 brigadistas.
   */
  Inscribir(usuarioId: string): Promise<Result<InscripcionBrigadistaResult>>;
}

export interface InscripcionBrigadistaResult {
  success: boolean;
  message: string;
  cuposRestantes: number;
}
