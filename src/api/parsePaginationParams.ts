import { NextRequest } from 'next/server';

/** Extrae page/pageSize crudos de la query string (sin normalizar todavía). */
export function parsePaginationParams(request: NextRequest): { page?: number; pageSize?: number } {
  return {
    page: Number(request.nextUrl.searchParams.get('page')),
    pageSize: Number(request.nextUrl.searchParams.get('pageSize')),
  };
}
