const { Acta } = require('../models');
const ErrorHandler = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

// @desc    Obtener todas las actas
// @route   GET /api/actas
// @access  Privado
exports.getActas = async (req, res, next) => {
  try {
    // Construir la consulta base
    const query = {};
    
    // Si hay un parámetro de comunidad en la consulta
    if (req.query.comunidad) {
      query.comunidad = req.query.comunidad;
    } 
    // Si no es superadmin, filtrar por la comunidad del usuario
    else if (req.usuario.rol !== 'superadmin' && req.usuario.comunidad) {
      query.comunidad = req.usuario.comunidad;
    }
    
    const actas = await Acta.find(query)
      .populate('creador', 'nombre email')
      .populate('comunidad', 'nombre')
      .sort({ fecha: -1 }); // Ordenar por fecha descendente (más recientes primero)

    res.status(200).json({
      success: true,
      count: actas.length,
      data: actas
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una acta por ID
// @route   GET /api/actas/:id
// @access  Privado
exports.getActa = async (req, res, next) => {
  try {
    const acta = await Acta.findById(req.params.id)
      .populate('creador', 'nombre email')
      .populate('comunidad', 'nombre');

    if (!acta) {
      return next(new ErrorHandler(`Acta no encontrada con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: acta
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nueva acta
// @route   POST /api/actas
// @access  Privado/Admin
exports.crearActa = async (req, res, next) => {
  try {
    // Añadir el usuario que crea el acta
    req.body.creador = req.usuario.id;
    
    // Verificar que se ha proporcionado una comunidad
    if (!req.body.comunidad) {
      // Si el usuario no es superadmin, usar su comunidad
      if (req.usuario.rol !== 'superadmin') {
        if (!req.usuario.comunidad) {
          return next(new ErrorHandler('No tienes una comunidad asignada para crear actas', 400));
        }
        // Asignar el ID de la comunidad del usuario
        req.body.comunidad = typeof req.usuario.comunidad === 'object' 
          ? req.usuario.comunidad._id || req.usuario.comunidad
          : req.usuario.comunidad;
      } else {
        return next(new ErrorHandler('Debes especificar una comunidad para el acta', 400));
      }
    }
    
    // Verificar que se ha subido un archivo
    if (!req.file) {
      return next(new ErrorHandler('Debes subir un archivo PDF', 400));
    }
    
    // Crear la URL del archivo
    const archivoUrl = `/uploads/actas/${req.file.filename}`;
    req.body.archivoUrl = archivoUrl;
    
    const acta = await Acta.create(req.body);

    res.status(201).json({
      success: true,
      data: acta
    });
  } catch (error) {
    // Si hay un error, eliminar el archivo subido
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'actas', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }
    next(error);
  }
};

// @desc    Eliminar acta
// @route   DELETE /api/actas/:id
// @access  Privado/Admin
exports.eliminarActa = async (req, res, next) => {
  try {
    const acta = await Acta.findById(req.params.id);
    
    if (!acta) {
      return next(new ErrorHandler(`Acta no encontrada con id ${req.params.id}`, 404));
    }
    
    // Eliminar el archivo
    const filePath = path.join(__dirname, '..', acta.archivoUrl.substring(1));
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error al eliminar archivo:', err);
    });
    
    // Eliminar el acta de la base de datos
    await acta.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Acta eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}; 