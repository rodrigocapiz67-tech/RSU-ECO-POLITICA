export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Normaliza page/pageSize desde query params sin confiar en el input crudo. */
export function normalizePagination(page?: number, pageSize?: number): PaginationParams {
  const normalizedPage = Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
  const normalizedPageSize =
    Number.isInteger(pageSize) && (pageSize as number) > 0
      ? Math.min(pageSize as number, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page: normalizedPage, pageSize: normalizedPageSize };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
