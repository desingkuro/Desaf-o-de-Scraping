import { Request, Response, NextFunction } from 'express';
import { AppError } from './appError';

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    const status = err.status || 500;
    const mensaje = err.message || 'Error interno del servidor';

    res.status(status).json({
        error: {
            mensaje: mensaje,
            estado: status
        }
    });
}

