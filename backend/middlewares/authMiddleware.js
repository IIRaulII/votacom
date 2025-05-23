const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const ErrorHandler = require('../utils/errorHandler');
const config = require('../config/config');

// Proteger rutas - verificar autenticación
exports.proteger = async (req, res, next) => {
  let token;

  // Verificar si hay token en las cabeceras
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Si no hay token en cabeceras, buscar en cookies
    token = req.cookies.token;
  }

  // Verificar si el token existe
  if (!token) {
    return next(new ErrorHandler('No estás autorizado para acceder a esta ruta', 401));
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Buscar el usuario con el ID del token
    req.usuario = await Usuario.findById(decoded.id).populate('comunidad', 'nombre codigo');

    if (!req.usuario) {
      return next(new ErrorHandler('Usuario no encontrado', 404));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler('No estás autorizado para acceder a esta ruta', 401));
  }
};

// Autorizar roles específicos
exports.autorizar = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return next(
        new ErrorHandler(`El rol ${req.usuario.rol} no está autorizado para esta acción`, 403)
      );
    }
    next();
  };
};

// Middleware para verificar que el usuario pertenece a una comunidad específica
exports.verificarComunidad = (paramName = 'comunidadId') => {
  return async (req, res, next) => {
    // El superadmin puede acceder a cualquier comunidad
    if (req.usuario.rol === 'superadmin') {
      return next();
    }

    const comunidadId = req.params[paramName] || req.body[paramName];

    // Si no hay ID de comunidad especificado, verificar que el usuario tenga una comunidad asignada
    if (!comunidadId) {
      if (!req.usuario.comunidad) {
        return next(new ErrorHandler('No perteneces a ninguna comunidad', 403));
      }
      return next();
    }

    // Verificar que el usuario pertenece a la comunidad especificada
    if (!req.usuario.comunidad || req.usuario.comunidad._id.toString() !== comunidadId) {
      return next(new ErrorHandler('No tienes permiso para acceder a esta comunidad', 403));
    }

    next();
  };
}; 