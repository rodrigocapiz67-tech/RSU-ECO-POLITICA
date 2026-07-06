import { IConfigRepository } from '../../../domain/interfaces/IConfigRepository';
import { Config } from '../../../domain/entities/Config';
import { ConfigScope } from '../../../domain/enums/ConfigScope';
import { Result } from '../../../domain/common/Result';
import { CreateConfigCommand } from './CreateConfigCommand';

export class CreateConfigHandler {
  constructor(private readonly configRepository: IConfigRepository) {}

  async Handle(command: CreateConfigCommand): Promise<Result<Config>> {
    const scope = (command.scope as ConfigScope) ?? ConfigScope.Global;

    const existing = await this.configRepository.GetByKey(command.key);
    if (existing.isSuccess) {
      return Result.Failure<Config>(`Config with key '${command.key}' already exists`);
    }

    const config = Config.Create(command.key, command.value, scope, command.description);
    return this.configRepository.Create(config);
  }
}
