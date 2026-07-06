export interface IUnitOfWork {
  SaveChangesAsync(): Promise<void>;
}
