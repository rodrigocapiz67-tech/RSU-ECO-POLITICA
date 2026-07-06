import { Config } from '../entities/Config';
import { Result } from '../common/Result';

export interface IConfigRepository {
  GetById(id: string): Promise<Result<Config>>;
  GetByKey(key: string): Promise<Result<Config>>;
  GetAll(): Promise<Result<Config[]>>;
  Create(config: Config): Promise<Result<Config>>;
  Update(config: Config): Promise<Result<Config>>;
  Delete(id: string): Promise<Result<void>>;
}
