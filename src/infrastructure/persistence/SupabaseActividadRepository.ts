import { IActividadRepository } from '../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../domain/entities/Actividad';
import { Result } from '../../domain/common/Result';
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

  async GetProximas(): Promise<Result<Actividad[]>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .gte('fecha', new Date().toISOString())
      .is('deleted_at', null)
      .order('fecha', { ascending: true });

    if (error) {
      return Result.Failure<Actividad[]>(
        `Error al listar próximas actividades: ${error.message}`,
      );
    }

    return Result.Success((data as ActividadRow[]).map((row) => this.MapToEntity(row)));
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
    revalidateTag('actividades');

    return Result.Success(this.MapToEntity(data as ActividadRow));
  }
}
