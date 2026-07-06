import { Entity } from '../common/Entity';
import { CategoriaReporte } from '../enums/CategoriaReporte';
import { PrioridadReporte } from '../enums/PrioridadReporte';
import { EstadoReporte } from '../enums/EstadoReporte';

export class Reporte extends Entity<string> {
  public readonly titulo: string;
  public readonly descripcion: string;
  public readonly categoria: CategoriaReporte;
  public readonly prioridad: PrioridadReporte;
  public estado: EstadoReporte;
  public readonly ubicacion: string;
  public readonly fotoUrl?: string;
  public readonly esAnonimo: boolean;
  public readonly autorId?: string;

  private constructor(
    id: string,
    titulo: string,
    descripcion: string,
    categoria: CategoriaReporte,
    prioridad: PrioridadReporte,
    estado: EstadoReporte,
    ubicacion: string,
    esAnonimo: boolean,
    fotoUrl?: string,
    autorId?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.prioridad = prioridad;
    this.estado = estado;
    this.ubicacion = ubicacion;
    this.esAnonimo = esAnonimo;
    this.fotoUrl = fotoUrl;
    this.autorId = autorId;
  }

  public static Create(
    titulo: string,
    descripcion: string,
    categoria: CategoriaReporte,
    ubicacion: string,
    prioridad: PrioridadReporte = PrioridadReporte.Media,
    esAnonimo = false,
    fotoUrl?: string,
    autorId?: string,
  ): Reporte {
    return new Reporte(
      crypto.randomUUID(),
      titulo,
      descripcion,
      categoria,
      prioridad,
      EstadoReporte.Enviado,
      ubicacion,
      esAnonimo,
      fotoUrl,
      esAnonimo ? undefined : autorId,
    );
  }

  public static Hydrate(
    id: string,
    titulo: string,
    descripcion: string,
    categoria: CategoriaReporte,
    prioridad: PrioridadReporte,
    estado: EstadoReporte,
    ubicacion: string,
    esAnonimo: boolean,
    fotoUrl?: string,
    autorId?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Reporte {
    return new Reporte(
      id,
      titulo,
      descripcion,
      categoria,
      prioridad,
      estado,
      ubicacion,
      esAnonimo,
      fotoUrl,
      autorId,
      createdAt,
      updatedAt,
    );
  }

  /** Transición de estado gestionada por staff/admin. */
  public CambiarEstado(nuevoEstado: EstadoReporte): void {
    this.estado = nuevoEstado;
    this.updatedAt = new Date();
  }
}
