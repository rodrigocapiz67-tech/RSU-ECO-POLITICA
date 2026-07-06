export abstract class Entity<TId = string> {
  public readonly id: TId;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? this.createdAt;
  }

  public equals(other: Entity<TId>): boolean {
    return this.id === other.id;
  }
}
