import { IConfigRepository } from '../domain/interfaces/IConfigRepository';
import { IActividadRepository } from '../domain/interfaces/IActividadRepository';
import { IInscripcionRepository } from '../domain/interfaces/IInscripcionRepository';
import { IReporteRepository } from '../domain/interfaces/IReporteRepository';
import { SupabaseConfigRepository } from './persistence/SupabaseConfigRepository';
import { SupabaseActividadRepository } from './persistence/SupabaseActividadRepository';
import { SupabaseInscripcionRepository } from './persistence/SupabaseInscripcionRepository';
import { SupabaseReporteRepository } from './persistence/SupabaseReporteRepository';

export interface IServiceProvider {
  configRepository: IConfigRepository;
  actividadRepository: IActividadRepository;
  inscripcionRepository: IInscripcionRepository;
  reporteRepository: IReporteRepository;
}

let serviceProvider: IServiceProvider | null = null;

export function GetServiceProvider(): IServiceProvider {
  if (!serviceProvider) {
    serviceProvider = {
      configRepository: new SupabaseConfigRepository(),
      actividadRepository: new SupabaseActividadRepository(),
      inscripcionRepository: new SupabaseInscripcionRepository(),
      reporteRepository: new SupabaseReporteRepository(),
    };
  }
  return serviceProvider;
}
