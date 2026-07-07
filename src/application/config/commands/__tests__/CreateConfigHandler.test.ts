import { describe, expect, it, vi } from 'vitest';
import { IConfigRepository } from '../../../../domain/interfaces/IConfigRepository';
import { Config } from '../../../../domain/entities/Config';
import { ConfigScope } from '../../../../domain/enums/ConfigScope';
import { Result } from '../../../../domain/common/Result';
import { CreateConfigHandler } from '../CreateConfigHandler';
import { CreateConfigCommand } from '../CreateConfigCommand';

function makeCommand(overrides: Partial<CreateConfigCommand> = {}): CreateConfigCommand {
  return {
    key: 'brigada.cupo_maximo',
    value: { limite: 90 },
    ...overrides,
  };
}

function makeRepository(existing: Config | null): IConfigRepository {
  return {
    GetById: vi.fn(),
    GetByKey: vi.fn(async () =>
      existing ? Result.Success(existing) : Result.Failure<Config>('Config not found'),
    ),
    GetAll: vi.fn(),
    Create: vi.fn(async (config: Config) => Result.Success(config)),
    Update: vi.fn(),
    Delete: vi.fn(),
  };
}

describe('CreateConfigHandler', () => {
  it('rechaza crear una config con una key que ya existe', async () => {
    const existing = Config.Create('brigada.cupo_maximo', { limite: 90 });
    const repo = makeRepository(existing);
    const handler = new CreateConfigHandler(repo);

    const result = await handler.Handle(makeCommand());

    expect(result.isFailure).toBe(true);
    expect(repo.Create).not.toHaveBeenCalled();
  });

  it('crea la config con scope global por defecto', async () => {
    const repo = makeRepository(null);
    const handler = new CreateConfigHandler(repo);

    const result = await handler.Handle(makeCommand());

    expect(result.isSuccess).toBe(true);
    expect(result.value?.scope).toBe(ConfigScope.Global);
    expect(repo.Create).toHaveBeenCalledTimes(1);
  });
});
