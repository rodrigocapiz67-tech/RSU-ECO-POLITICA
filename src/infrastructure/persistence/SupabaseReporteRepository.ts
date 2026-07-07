import { IReporteRepository } from '../../domain/interfaces/IReporteRepository';
import { Reporte } from '../../domain/entities/Reporte';
import { CategoriaReporte } from '../../domain/enums/CategoriaReporte';
import { PrioridadReporte } from '../../domain/enums/PrioridadReporte';
import { EstadoReporte } from '../../domain/enums/EstadoReporte';
import { Result } from '../../domain/common/Result';
import { PaginatedResult, PaginationParams, toPaginatedResult } from '../../domain/common/Pagination';
import { RANGE_NOT_SATISFIABLE_CODE, toRange } from './PaginationHelpers';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

interface ReporteRow {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  ubicacion: string;
  foto_url: string | null;
  es_anonimo: boolean;
  autor_id: string | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseReporteRepository implements IReporteRepository {
  private readonly table = 'reportes';

  private MapToEntity(row: ReporteRow): Reporte {
    return Reporte.Hydrate(
      row.id,
      row.titulo,
      row.descripcion,
      row.categoria as CategoriaReporte,
      row.prioridad as PrioridadReporte,
      row.estado as EstadoReporte,
      row.ubicacion,
      row.es_anonimo,
      row.foto_url ?? undefined,
      row.autor_id ?? undefined,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  async GetById(id: string): Promise<Result<Reporte>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Result.Failure<Reporte>(
        `Reporte no encontrado: ${error?.message ?? 'unknown error'}`,
      );
    }

    return Result.Success(this.MapToEntity(data as ReporteRow));
  }

  async GetAll(pagination: PaginationParams): Promise<Result<PaginatedResult<Reporte>>> {
    const client = await CreateSupabaseServerClient();
    const { from, to } = toRange(pagination);

    const { data, error, count } = await client
      .from(this.table)
      .select('*', { count: 'estimated' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      // Página pedida más allá del total de filas: es una página vacía, no un error.
      if (error.code === RANGE_NOT_SATISFIABLE_CODE) {
        const { count: total } = await client
          .from(this.table)
          .select('*', { count: 'estimated', head: true })
          .is('deleted_at', null);
        return Result.Success(toPaginatedResult<Reporte>([], total ?? 0, pagination));
      }

      return Result.Failure<PaginatedResult<Reporte>>(`Error al listar reportes: ${error.message}`);
    }

    const items = (data as ReporteRow[]).map((row) => this.MapToEntity(row));
    return Result.Success(toPaginatedResult(items, count ?? items.length, pagination));
  }

  async GetByAutor(autorId: string): Promise<Result<Reporte[]>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('autor_id', autorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return Result.Failure<Reporte[]>(
        `Error al listar reportes del autor: ${error.message}`,
      );
    }

    return Result.Success((data as ReporteRow[]).map((row) => this.MapToEntity(row)));
  }

  async Create(reporte: Reporte): Promise<Result<Reporte>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .insert({
        id: reporte.id,
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        categoria: reporte.categoria,
        prioridad: reporte.prioridad,
        estado: reporte.estado,
        ubicacion: reporte.ubicacion,
        foto_url: reporte.fotoUrl ?? null,
        es_anonimo: reporte.esAnonimo,
        autor_id: reporte.autorId ?? null,
      })
      .select()
      .single();

    if (error) {
      return Result.Failure<Reporte>(`Error al crear reporte: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as ReporteRow));
  }

  async Update(reporte: Reporte): Promise<Result<Reporte>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .update({
        estado: reporte.estado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reporte.id)
      .select()
      .single();

    if (error) {
      return Result.Failure<Reporte>(`Error al actualizar reporte: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as ReporteRow));
  }
}
