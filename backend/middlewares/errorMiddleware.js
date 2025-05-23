const ErrorHandler = require('../utils/errorHandler');

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  // En desarrollo, mostrar todos los detalles
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // En producción, mostrar un mensaje más limpio
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // MongoDB error: ID inválido
    if (err.name === 'CastError') {
      const message = `Recurso no encontrado. ID inválido: ${err.value}`;
      error = new ErrorHandler(message, 404);
    }

    // MongoDB error: clave duplicada
    if (err.code === 11000) {
      const message = `Valor duplicado para ${Object.keys(err.keyValue)}`;
      error = new ErrorHandler(message, 400);
    }

    // MongoDB error: validación
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      error = new ErrorHandler(message, 400);
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error del servidor'
    });
  }

  next();
};

module.exports = errorMiddleware; 