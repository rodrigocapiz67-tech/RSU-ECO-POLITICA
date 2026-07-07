import { IActividadRepository } from '../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../domain/entities/Actividad';
import { Result } from '../../domain/common/Result';
import { PaginatedResult, PaginationParams, toPaginatedResult } from '../../domain/common/Pagination';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';
import { CreateSupabaseAnonClient } from '../supabase/SupabaseAnonClient';
import { unstable_cache, revalidateTag } from 'next/cache';

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

  async GetAll(): Promise<Result<Actividad[]>> {
    // Definimos la función cacheada globalmente
    const getCachedActividades = unstable_cache(
      async () => {
        const client = CreateSupabaseAnonClient();
        const { data, error } = await client
          .from(this.table)
          .select('*')
          .is('deleted_at', null)
          .order('fecha', { ascending: true });
        
        if (error) throw new Error(error.message);
        return data as ActividadRow[];
      },
      ['actividades_all'],
      { tags: ['actividades'], revalidate: 3600 } // Cachear por 1 hora o hasta que se revalide
    );

    try {
      const data = await getCachedActividades();
      return Result.Success(data.map((row) => this.MapToEntity(row)));
    } catch (error: any) {
      return Result.Failure<Actividad[]>(`Error al listar actividades: ${error.message}`);
    }
  }

  async GetProximas(pagination: PaginationParams): Promise<Result<PaginatedResult<Actividad>>> {
    const client = await CreateSupabaseServerClient();
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    const { data, error, count } = await client
      .from(this.table)
      .select('*', { count: 'exact' })
      .gte('fecha', new Date().toISOString())
      .is('deleted_at', null)
      .order('fecha', { ascending: true })
      .range(from, to);

    if (error) {
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

    // Purgar la caché para que el próximo GetAll() traiga los datos frescos
    // (el profile debe matchear el `revalidate: 3600` usado en el unstable_cache de arriba).
    revalidateTag('actividades', { expire: 3600 });

    return Result.Success(this.MapToEntity(data as ActividadRow));
  }
}
