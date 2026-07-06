import { Entity } from '../common/Entity';
import { ConfigScope } from '../enums/ConfigScope';

export class Config extends Entity<string> {
  public readonly key: string;
  public readonly value: Record<string, unknown>;
  public readonly scope: ConfigScope;
  public readonly description?: string;

  private constructor(
    id: string,
    key: string,
    value: Record<string, unknown>,
    scope: ConfigScope,
    description?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.key = key;
    this.value = value;
    this.scope = scope;
    this.description = description;
  }

  public static Create(
    key: string,
    value: Record<string, unknown>,
    scope: ConfigScope = ConfigScope.Global,
    description?: string,
  ): Config {
    return new Config(
      crypto.randomUUID(),
      key,
      value,
      scope,
      description,
    );
  }

  public static Hydrate(
    id: string,
    key: string,
    value: Record<string, unknown>,
    scope: ConfigScope,
    description?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Config {
    return new Config(id, key, value, scope, description, createdAt, updatedAt);
  }

  public UpdateValue(newValue: Record<string, unknown>): void {
    this.updatedAt = new Date();
  }
}
