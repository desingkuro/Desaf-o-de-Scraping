export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const mensaje = err.message || 'Error interno del servidor';
    res.status(status).json({
        error: {
            mensaje: mensaje,
            estado: status
        }
    });
};
