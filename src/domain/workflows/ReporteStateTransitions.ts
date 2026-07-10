import { EstadoReporte } from '../enums/EstadoReporte';

/**
 * Define las transiciones válidas en la máquina de estados de Reportes.
 * Coordinators solo pueden avanzar (no retroceder).
 * Admins pueden cualquier transición.
 */
export const VALID_TRANSITIONS: Record<EstadoReporte, EstadoReporte[]> = {
  [EstadoReporte.Enviado]: [
    EstadoReporte.EnRevision,    // Coordinador comienza revisión
    EstadoReporte.Cerrado,       // Admin cancela directamente
  ],
  [EstadoReporte.EnRevision]: [
    EstadoReporte.EnProceso,     // Coordinador aprueba y asigna
    EstadoReporte.Cerrado,       // Admin/Coordinador cancela
  ],
  [EstadoReporte.EnProceso]: [
    EstadoReporte.Resuelto,      // Coordinador marca como resuelto
    EstadoReporte.Cerrado,       // Se cancela
  ],
  [EstadoReporte.Resuelto]: [
    EstadoReporte.Cerrado,       // Admin archiva
  ],
  [EstadoReporte.Cerrado]: [],   // Estado final, sin salida
};

/**
 * Coordinators solo pueden hacer transiciones "forward" (no retroceder).
 * Admins pueden cualquier transición.
 */
export const COORDINATOR_ALLOWED_TRANSITIONS: Record<EstadoReporte, EstadoReporte[]> = {
  [EstadoReporte.Enviado]: [EstadoReporte.EnRevision],
  [EstadoReporte.EnRevision]: [EstadoReporte.EnProceso, EstadoReporte.Cerrado],
  [EstadoReporte.EnProceso]: [EstadoReporte.Resuelto, EstadoReporte.Cerrado],
  [EstadoReporte.Resuelto]: [],  // Coordinators no pueden cambiar estado resuelto
  [EstadoReporte.Cerrado]: [],
};

export function canTransition(
  currentState: EstadoReporte,
  nextState: EstadoReporte,
  isAdmin: boolean,
): boolean {
  const validTransitions = isAdmin
    ? VALID_TRANSITIONS[currentState]
    : COORDINATOR_ALLOWED_TRANSITIONS[currentState];

  return validTransitions.includes(nextState);
}
