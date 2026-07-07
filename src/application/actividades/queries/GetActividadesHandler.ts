import { IActividadRepository } from '../../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../../domain/entities/Actividad';
import { Result } from '../../../domain/common/Result';
import { PaginatedResult, normalizePagination } from '../../../domain/common/Pagination';
import { GetActividadByIdQuery, GetActividadesQuery } from './GetActividadesQuery';

export class GetActividadesHandler {
  constructor(private readonly actividadRepository: IActividadRepository) {}

  async Handle(query: GetActividadesQuery = {}): Promise<Result<PaginatedResult<Actividad>>> {
    const pagination = normalizePagination(query.page, query.pageSize);
    return this.actividadRepository.GetProximas(pagination);
  }
}

export class GetActividadByIdHandler {
  constructor(private readonly actividadRepository: IActividadRepository) {}

  async Handle(query: GetActividadByIdQuery): Promise<Result<Actividad>> {
    return this.actividadRepository.GetById(query.id);
  }
}
