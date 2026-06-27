export class AppError extends Error {
    status;
    constructor(mensaje, status) {
        super(mensaje);
        this.status = status;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
