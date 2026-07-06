export interface GetActividadByIdQuery {
  id: string;
}

// Marcador para la consulta de listado (sin filtros en el MVP).
export type GetActividadesQuery = Record<string, never>;
