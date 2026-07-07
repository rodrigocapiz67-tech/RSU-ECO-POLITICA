export interface GetReporteByIdQuery {
  id: string;
}

export interface GetReportesQuery {
  page?: number;
  pageSize?: number;
}

export interface GetReportesByAutorQuery {
  autorId: string;
}
