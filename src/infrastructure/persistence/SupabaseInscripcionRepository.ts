import { IInscripcionRepository } from '../../domain/interfaces/IInscripcionRepository';
import { Inscripcion } from '../../domain/entities/Inscripcion';
import { Result } from '../../domain/common/Result';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

interface InscripcionRow {
  id: string;
  actividad_id: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseInscripcionRepository implements IInscripcionRepository {
  private readonly table = 'inscripciones';

  private MapToEntity(row: InscripcionRow): Inscripcion {
    return Inscripcion.Hydrate(
      row.id,
      row.actividad_id,
      row.usuario_id,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  async Create(inscripcion: Inscripcion): Promise<Result<Inscripcion>> {
    const client = await CreateSupabaseServerClient();

    // Usar RPC con advisory lock para evitar race conditions en cupo
    const { data, error } = await client.rpc('inscribir_en_actividad', {
      p_actividad_id: inscripcion.actividadId,
      p_usuario_id: inscripcion.usuarioId,
    });

    if (error) {
      return Result.Failure<Inscripcion>(`Error al crear inscripción: ${error.message}`);
    }

    const response = data as { success: boolean; error?: string };
    if (!response.success) {
      return Result.Failure<Inscripcion>(response.error ?? 'Error desconocido al inscribirse');
    }

    // Fetch inscripción creada para retornar entity
    const { data: inscripcionData, error: fetchError } = await client
      .from(this.table)
      .select('*')
      .eq('usuario_id', inscripcion.usuarioId)
      .eq('actividad_id', inscripcion.actividadId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      return Result.Failure<Inscripcion>(`Error al recuperar inscripción creada: ${fetchError.message}`);
    }

    return Result.Success(this.MapToEntity(inscripcionData as InscripcionRow));
  }

  async Delete(id: string): Promise<Result<void>> {
    const client = await CreateSupabaseServerClient();
    const { error } = await client
      .from(this.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return Result.Failure<void>(`Error al cancelar inscripción: ${error.message}`);
    }

    return Result.Success(undefined);
  }

  async ExisteInscripcion(
    actividadId: string,
    usuarioId: string,
  ): Promise<Result<boolean>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('id')
      .eq('actividad_id', actividadId)
      .eq('usuario_id', usuarioId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return Result.Failure<boolean>(`Error al verificar inscripción: ${error.message}`);
    }

    return Result.Success(data !== null);
  }

  async ContarPorActividad(actividadId: string): Promise<Result<number>> {
    const client = await CreateSupabaseServerClient();
    const { count, error } = await client
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividadId)
      .is('deleted_at', null);

    if (error) {
      return Result.Failure<number>(`Error al contar inscripciones: ${error.message}`);
    }

    return Result.Success(count ?? 0);
  }

  async GetByUsuario(usuarioId: string): Promise<Result<Inscripcion[]>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('usuario_id', usuarioId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return Result.Failure<Inscripcion[]>(
        `Error al listar inscripciones del usuario: ${error.message}`,
      );
    }

    return Result.Success((data as InscripcionRow[]).map((row) => this.MapToEntity(row)));
  }
}
