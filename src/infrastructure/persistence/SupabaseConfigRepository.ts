import { IConfigRepository } from '../../domain/interfaces/IConfigRepository';
import { Config } from '../../domain/entities/Config';
import { ConfigScope } from '../../domain/enums/ConfigScope';
import { Result } from '../../domain/common/Result';
import { CreateSupabaseServerClient } from '../supabase/SupabaseServerClient';

interface ConfigRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  scope: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseConfigRepository implements IConfigRepository {
  private readonly table = 'config';

  private MapToEntity(row: ConfigRow): Config {
    return Config.Hydrate(
      row.id,
      row.key,
      row.value,
      row.scope as ConfigScope,
      row.description ?? undefined,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  async GetById(id: string): Promise<Result<Config>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return Result.Failure<Config>(`Config not found: ${error?.message ?? 'unknown error'}`);
    }

    return Result.Success(this.MapToEntity(data as ConfigRow));
  }

  async GetByKey(key: string): Promise<Result<Config>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .eq('key', key)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return Result.Failure<Config>(`Config '${key}' not found: ${error?.message ?? 'unknown error'}`);
    }

    return Result.Success(this.MapToEntity(data as ConfigRow));
  }

  async GetAll(): Promise<Result<Config[]>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return Result.Failure<Config[]>(`Failed to fetch configs: ${error.message}`);
    }

    return Result.Success((data as ConfigRow[]).map((row) => this.MapToEntity(row)));
  }

  async Create(config: Config): Promise<Result<Config>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .insert({
        id: config.id,
        key: config.key,
        value: config.value,
        scope: config.scope,
        description: config.description ?? null,
      })
      .select()
      .single();

    if (error) {
      return Result.Failure<Config>(`Failed to create config: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as ConfigRow));
  }

  async Update(config: Config): Promise<Result<Config>> {
    const client = await CreateSupabaseServerClient();
    const { data, error } = await client
      .from(this.table)
      .update({
        value: config.value,
        description: config.description ?? null,
      })
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      return Result.Failure<Config>(`Failed to update config: ${error.message}`);
    }

    return Result.Success(this.MapToEntity(data as ConfigRow));
  }

  async Delete(id: string): Promise<Result<void>> {
    const client = await CreateSupabaseServerClient();
    const { error } = await client
      .from(this.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return Result.Failure<void>(`Failed to delete config: ${error.message}`);
    }

    return Result.Success(undefined);
  }
}
