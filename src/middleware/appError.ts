export class AppError extends Error {
  status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}