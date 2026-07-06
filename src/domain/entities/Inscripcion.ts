import { Entity } from '../common/Entity';

export class Inscripcion extends Entity<string> {
  public readonly actividadId: string;
  public readonly usuarioId: string;

  private constructor(
    id: string,
    actividadId: string,
    usuarioId: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.actividadId = actividadId;
    this.usuarioId = usuarioId;
  }

  public static Create(actividadId: string, usuarioId: string): Inscripcion {
    return new Inscripcion(crypto.randomUUID(), actividadId, usuarioId);
  }

  public static Hydrate(
    id: string,
    actividadId: string,
    usuarioId: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Inscripcion {
    return new Inscripcion(id, actividadId, usuarioId, createdAt, updatedAt);
  }
}
