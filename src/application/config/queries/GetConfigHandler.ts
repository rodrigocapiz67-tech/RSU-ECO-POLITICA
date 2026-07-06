import { IConfigRepository } from '../../../domain/interfaces/IConfigRepository';
import { Config } from '../../../domain/entities/Config';
import { Result } from '../../../domain/common/Result';
import { GetConfigByKeyQuery, GetConfigByIdQuery } from './GetConfigQuery';

export class GetConfigByKeyHandler {
  constructor(private readonly configRepository: IConfigRepository) {}

  async Handle(query: GetConfigByKeyQuery): Promise<Result<Config>> {
    return this.configRepository.GetByKey(query.key);
  }
}

export class GetConfigByIdHandler {
  constructor(private readonly configRepository: IConfigRepository) {}

  async Handle(query: GetConfigByIdQuery): Promise<Result<Config>> {
    return this.configRepository.GetById(query.id);
  }
}
