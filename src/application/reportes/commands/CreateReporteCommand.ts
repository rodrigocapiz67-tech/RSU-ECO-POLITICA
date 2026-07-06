export interface CreateReporteCommand {
  titulo: string;
  descripcion: string;
  categoria: string;
  ubicacion: string;
  prioridad?: string;
  esAnonimo?: boolean;
  fotoUrl?: string;
  autorId?: string;
}
