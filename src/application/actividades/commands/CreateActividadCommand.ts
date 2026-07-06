export interface CreateActividadCommand {
  titulo: string;
  descripcion: string;
  fecha: string; // ISO 8601
  ubicacion: string;
  cupoMaximo: number;
  organizadorId: string;
}
