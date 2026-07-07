import { IActividadRepository } from '../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../domain/entities/Actividad';
import { Result } from '../../domain/common/Result';
import { PaginatedResult, PaginationParams, toPaginatedResult, toRange } from '../../domain/common/Pagination';
import { RANGE_NOT_SATISFIABLE_CODE } from './PaginationHelpers';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

interface ActividadRow {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  ubicacion: string;
  cupo_maximo: number;
  organizador_id: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseActividadRepository implements IActividadRepository {
  private readonly table = 'actividades';

  private MapToEntity(row: ActividadRow): Actividad {
    return Actividad.Hydrate(
      row.id,
      row.titulo,
      row.descripcion,
      new Date(row.fecha),
      row.ubicacion,
      row.cupo_maximo,
      row.organizador_id,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  async GetById(id: string): Promise<Result<Actividad>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Result.Failure<Actividad>(
        `Actividad no encontrada: ${error?.message ?? 'unknown error'}`,
      );
    }

    return Result.Success(this.MapToEntity(data as ActividadRow));
  }

  async GetProximas(pagination: PaginationParams): Promise<Result<PaginatedResult<Actividad>>> {
    const client = await CreateSupabaseServerClient();
    const { from, to } = toRange(pagination);

    const { data, error, count } = await client
      .from(this.table)
      .select('*', { count: 'exact' })
      .gte('fecha', new Date().toISOString())
      .is('deleted_at', null)
      .order('fecha', { ascending: true })
      .range(from, to);

    if (error) {
      // Página pedida más allá del total de filas: es una página vacía, no un error.
      if (error.code === RANGE_NOT_SATISFIABLE_CODE) {
        const countResult = await client
          .from(this.table)
          .select('*', { count: 'exact', head: true })
          .gte('fecha', new Date().toISOString())
          .is('deleted_at', null);

        if (countResult.error) {
          return Result.Failure<PaginatedResult<Actividad>>(
            `Error al listar próximas actividades: ${countResult.error.message}`,
          );
        }

        return Result.Success(toPaginatedResult<Actividad>([], countResult.count ?? 0, pagination));
      }

      return Result.Failure<PaginatedResult<Actividad>>(
        `Error al listar próximas actividades: ${error.message}`,
      );
    }

    const items = (data as ActividadRow[]).map((row) => this.MapToEntity(row));
    return Result.Success(toPaginatedResult(items, count ?? items.length, pagination));
  }

  async Create(actividad: Actividad): Promise<Result<Actividad>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .insert({
        id: actividad.id,
        titulo: actividad.titulo,
        descripcion: actividad.descripcion,
        fecha: actividad.fecha.toISOString(),
        ubicacion: actividad.ubicacion,
        cupo_maximo: actividad.cupoMaximo,
        organizador_id: actividad.organizadorId,
      })
      .select()
      .single();

    if (error) {
      return Result.Failure<Actividad>(`Error al crear actividad: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as ActividadRow));
  }
}
