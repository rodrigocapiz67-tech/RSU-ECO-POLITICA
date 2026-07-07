import { PaginationParams } from '../../domain/common/Pagination';

/** PostgREST: "Requested range not satisfiable" (offset más allá del total de filas). */
export const RANGE_NOT_SATISFIABLE_CODE = 'PGRST103';

export function toRange(pagination: PaginationParams): { from: number; to: number } {
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  return { from, to };
}
