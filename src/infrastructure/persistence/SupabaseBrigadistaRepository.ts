import { IBrigadistaRepository, InscripcionBrigadistaResult } from '../../domain/interfaces/IBrigadistaRepository';
import { Result } from '../../domain/common/Result';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

export class SupabaseBrigadistaRepository implements IBrigadistaRepository {
  
  async Inscribir(usuarioId: string): Promise<Result<InscripcionBrigadistaResult>> {
    const client = await CreateSupabaseServerClient();
    
    // Llamada directa al RPC (Remote Procedure Call) en PostgreSQL
    const { data, error } = await client.rpc('inscribir_brigadista', {
      p_usuario_id: usuarioId,
    });

    if (error) {
      return Result.Failure(`Error de base de datos al inscribir brigadista: ${error.message}`);
    }

    // Casteamos la respuesta JSON devuelta por nuestra función SQL
    const response = data as { success: boolean; error?: string; message?: string; cupos_restantes?: number };

    if (!response.success) {
      return Result.Failure(response.error ?? 'Error desconocido al inscribir brigadista');
    }

    return Result.Success({
      success: true,
      message: response.message ?? 'Inscripción exitosa',
      cuposRestantes: response.cupos_restantes ?? 0,
    });
  }
}
