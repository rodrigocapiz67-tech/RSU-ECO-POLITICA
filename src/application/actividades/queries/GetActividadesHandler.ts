import { IActividadRepository } from '../../../domain/interfaces/IActividadRepository';
import { Actividad } from '../../../domain/entities/Actividad';
import { Result } from '../../../domain/common/Result';
import { GetActividadByIdQuery } from './GetActividadesQuery';

export class GetActividadesHandler {
  constructor(private readonly actividadRepository: IActividadRepository) {}

  async Handle(): Promise<Result<Actividad[]>> {
    return this.actividadRepository.GetProximas();
  }
}

export class GetActividadByIdHandler {
  constructor(private readonly actividadRepository: IActividadRepository) {}

  async Handle(query: GetActividadByIdQuery): Promise<Result<Actividad>> {
    return this.actividadRepository.GetById(query.id);
  }
}
