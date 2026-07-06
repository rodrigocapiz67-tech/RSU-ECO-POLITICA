export class Result<T = void> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value?: T,
    public readonly error?: string
  ) {}

  public static Success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  public static Failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  public get isFailure(): boolean {
    return !this.isSuccess;
  }

  public getOrThrow(): T {
    if (this.isFailure) throw new Error(this.error);
    return this.value as T;
  }
}
