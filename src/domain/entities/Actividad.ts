import { Entity } from '../common/Entity';

export class Actividad extends Entity<string> {
  public readonly titulo: string;
  public readonly descripcion: string;
  public readonly fecha: Date;
  public readonly ubicacion: string;
  public readonly cupoMaximo: number;
  public readonly organizadorId: string;

  private constructor(
    id: string,
    titulo: string,
    descripcion: string,
    fecha: Date,
    ubicacion: string,
    cupoMaximo: number,
    organizadorId: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fecha = fecha;
    this.ubicacion = ubicacion;
    this.cupoMaximo = cupoMaximo;
    this.organizadorId = organizadorId;
  }

  public static Create(
    titulo: string,
    descripcion: string,
    fecha: Date,
    ubicacion: string,
    cupoMaximo: number,
    organizadorId: string,
  ): Actividad {
    return new Actividad(
      crypto.randomUUID(),
      titulo,
      descripcion,
      fecha,
      ubicacion,
      cupoMaximo,
      organizadorId,
    );
  }

  public static Hydrate(
    id: string,
    titulo: string,
    descripcion: string,
    fecha: Date,
    ubicacion: string,
    cupoMaximo: number,
    organizadorId: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Actividad {
    return new Actividad(
      id,
      titulo,
      descripcion,
      fecha,
      ubicacion,
      cupoMaximo,
      organizadorId,
      createdAt,
      updatedAt,
    );
  }

  /** Regla de negocio: hay cupo disponible si los inscritos no superan el máximo. */
  public TieneCupo(inscritosActuales: number): boolean {
    return inscritosActuales < this.cupoMaximo;
  }
}
