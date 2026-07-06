import { IInscripcionRepository } from '../../domain/interfaces/IInscripcionRepository';
import { Inscripcion } from '../../domain/entities/Inscripcion';
import { Result } from '../../domain/common/Result';
import { CreateServerSupabaseClient } from '../supabase/SupabaseClient';

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
    const client = CreateServerSupabaseClient();
    const { data, error } = await client
      .from(this.table)
      .insert({
        id: inscripcion.id,
        actividad_id: inscripcion.actividadId,
        usuario_id: inscripcion.usuarioId,
      })
      .select()
      .single();

    if (error) {
      return Result.Failure<Inscripcion>(`Error al crear inscripción: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as InscripcionRow));
  }

  async Delete(id: string): Promise<Result<void>> {
    const client = CreateServerSupabaseClient();
    const { error } = await client.from(this.table).delete().eq('id', id);

    if (error) {
      return Result.Failure<void>(`Error al cancelar inscripción: ${error.message}`);
    }

    return Result.Success(undefined);
  }

  async ExisteInscripcion(
    actividadId: string,
    usuarioId: string,
  ): Promise<Result<boolean>> {
    const client = CreateServerSupabaseClient();
    const { data, error } = await client
      .from(this.table)
      .select('id')
      .eq('actividad_id', actividadId)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) {
      return Result.Failure<boolean>(`Error al verificar inscripción: ${error.message}`);
    }

    return Result.Success(data !== null);
  }

  async ContarPorActividad(actividadId: string): Promise<Result<number>> {
    const client = CreateServerSupabaseClient();
    const { count, error } = await client
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('actividad_id', actividadId);

    if (error) {
      return Result.Failure<number>(`Error al contar inscripciones: ${error.message}`);
    }

    return Result.Success(count ?? 0);
  }

  async GetByUsuario(usuarioId: string): Promise<Result<Inscripcion[]>> {
    const client = CreateServerSupabaseClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (error) {
      return Result.Failure<Inscripcion[]>(
        `Error al listar inscripciones del usuario: ${error.message}`,
      );
    }

    return Result.Success((data as InscripcionRow[]).map((row) => this.MapToEntity(row)));
  }
}
