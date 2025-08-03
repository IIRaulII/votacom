const { Factura } = require('../models');
const ErrorHandler = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

// @desc    Obtener todas las facturas
// @route   GET /api/facturas
// @access  Privado
exports.getFacturas = async (req, res, next) => {
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
    
    const facturas = await Factura.find(query)
      .populate('creador', 'nombre email')
      .populate('comunidad', 'nombre')
      .sort({ fecha: -1 }); // Ordenar por fecha descendente (más recientes primero)

    res.status(200).json({
      success: true,
      count: facturas.length,
      data: facturas
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una factura por ID
// @route   GET /api/facturas/:id
// @access  Privado
exports.getFactura = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id)
      .populate('creador', 'nombre email')
      .populate('comunidad', 'nombre');

    if (!factura) {
      return next(new ErrorHandler(`Factura no encontrada con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: factura
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nueva factura
// @route   POST /api/facturas
// @access  Privado/Admin
exports.crearFactura = async (req, res, next) => {
  try {
    // Añadir el usuario que crea la factura
    req.body.creador = req.usuario.id;
    
    // Verificar que se ha proporcionado una comunidad
    if (!req.body.comunidad) {
      // Si el usuario no es superadmin, usar su comunidad
      if (req.usuario.rol !== 'superadmin') {
        if (!req.usuario.comunidad) {
          return next(new ErrorHandler('No tienes una comunidad asignada para crear facturas', 400));
        }
        // Asignar el ID de la comunidad del usuario
        req.body.comunidad = typeof req.usuario.comunidad === 'object' 
          ? req.usuario.comunidad._id || req.usuario.comunidad
          : req.usuario.comunidad;
      } else {
        return next(new ErrorHandler('Debes especificar una comunidad para la factura', 400));
      }
    }
    
    // Verificar que se ha subido un archivo
    if (!req.file) {
      return next(new ErrorHandler('Debes subir un archivo PDF', 400));
    }
    
    // Crear la URL del archivo
    const archivoUrl = `/uploads/facturas/${req.file.filename}`;
    req.body.archivoUrl = archivoUrl;
    
    const factura = await Factura.create(req.body);

    res.status(201).json({
      success: true,
      data: factura
    });
  } catch (error) {
    // Si hay un error, eliminar el archivo subido
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'facturas', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error al eliminar archivo:', err);
      });
    }
    next(error);
  }
};

// @desc    Eliminar factura
// @route   DELETE /api/facturas/:id
// @access  Privado/Admin
exports.eliminarFactura = async (req, res, next) => {
  try {
    const factura = await Factura.findById(req.params.id);
    
    if (!factura) {
      return next(new ErrorHandler(`Factura no encontrada con id ${req.params.id}`, 404));
    }
    
    // Eliminar el archivo
    const filePath = path.join(__dirname, '..', factura.archivoUrl.substring(1));
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error al eliminar archivo:', err);
    });
    
    // Eliminar la factura de la base de datos
    await factura.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Factura eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
}; 