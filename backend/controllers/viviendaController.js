const { Vivienda, Usuario } = require('../models');
const ErrorHandler = require('../utils/errorHandler');

// Función auxiliar para calcular la suma de coeficientes
const calcularSumaCoeficientes = async (comunidadId, viviendaIdExcluida = null) => {
  const query = { comunidad: comunidadId };
  
  if (viviendaIdExcluida) {
    query._id = { $ne: viviendaIdExcluida };
  }
  
  const viviendas = await Vivienda.find(query);
  return viviendas.reduce((sum, vivienda) => sum + vivienda.coeficiente, 0);
};

// @desc    Obtener todas las viviendas
// @route   GET /api/viviendas
// @access  Privado/Admin
exports.getViviendas = async (req, res, next) => {
  try {
    // Obtener sólo las viviendas de la comunidad del usuario
    const query = {};
    
    // Si no es superadmin, filtrar por comunidad
    if (req.usuario.rol !== 'superadmin' && req.usuario.comunidad) {
      query.comunidad = req.usuario.comunidad;
    } else if (req.query.comunidad) {
      // Si es superadmin y se especifica comunidad en la consulta
      query.comunidad = req.query.comunidad;
    }
    
    const viviendas = await Vivienda.find(query)
      .populate('habitantes', 'nombre email rol')
      .populate('comunidad', 'nombre');
      
    // Calcular suma de coeficientes para la comunidad correspondiente
    let sumaCoeficientes = 0;
    if (query.comunidad) {
      sumaCoeficientes = viviendas.reduce((sum, vivienda) => sum + vivienda.coeficiente, 0);
    }

    res.status(200).json({
      success: true,
      count: viviendas.length,
      data: viviendas,
      sumaCoeficientes: parseFloat(sumaCoeficientes.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una vivienda por ID
// @route   GET /api/viviendas/:id
// @access  Privado/Admin
exports.getVivienda = async (req, res, next) => {
  try {
    const vivienda = await Vivienda.findById(req.params.id)
      .populate('habitantes', 'nombre email rol')
      .populate('comunidad', 'nombre');

    if (!vivienda) {
      return next(new ErrorHandler(`Vivienda no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar que el usuario tiene acceso a esta vivienda
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || 
         req.usuario.comunidad._id.toString() !== vivienda.comunidad._id.toString())) {
      return next(new ErrorHandler('No tienes permiso para ver esta vivienda', 403));
    }

    res.status(200).json({
      success: true,
      data: vivienda
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nueva vivienda
// @route   POST /api/viviendas
// @access  Privado/Admin
exports.crearVivienda = async (req, res, next) => {
  try {
    const { numeroPuerta, coeficiente, derechoVoto, comunidad: comunidadId } = req.body;
    
    if (!numeroPuerta || coeficiente === undefined) {
      return next(new ErrorHandler('El número de puerta y coeficiente son obligatorios', 400));
    }

    // Determinar la comunidad a usar
    let comunidad = comunidadId;
    
    // Si no se especifica la comunidad, usar la del usuario logueado
    if (!comunidad && req.usuario.comunidad) {
      comunidad = req.usuario.comunidad;
    }
    
    // Si no hay comunidad, error
    if (!comunidad) {
      return next(new ErrorHandler('La comunidad es obligatoria', 400));
    }
    
    // Si el usuario no es superadmin, verificar que la comunidad sea la suya
    if (req.usuario.rol !== 'superadmin' && 
        req.usuario.comunidad && 
        req.usuario.comunidad._id.toString() !== comunidad.toString()) {
      return next(new ErrorHandler('No puedes crear viviendas en otras comunidades', 403));
    }

    // Verificar si ya existe una vivienda con ese número de puerta en la misma comunidad
    const viviendaExiste = await Vivienda.findOne({ 
      numeroPuerta,
      comunidad
    });
    
    if (viviendaExiste) {
      return next(new ErrorHandler(`Ya existe una vivienda con el número de puerta ${numeroPuerta} en esta comunidad`, 400));
    }

    // Verificar que el coeficiente sea válido
    const coeficienteNum = parseFloat(coeficiente);
    if (isNaN(coeficienteNum) || coeficienteNum <= 0) {
      return next(new ErrorHandler('El coeficiente debe ser un número mayor que 0', 400));
    }

    // Calcular la suma actual de coeficientes para esta comunidad
    const sumaActual = await calcularSumaCoeficientes(comunidad);
    const nuevaSuma = sumaActual + coeficienteNum;
    
    // Verificar que no se exceda el 100%
    if (nuevaSuma > 100.001) { // Se usa 100.001 para manejar errores de redondeo
      return next(new ErrorHandler(`La suma de coeficientes excedería el 100%. Suma actual: ${sumaActual.toFixed(2)}%, disponible: ${(100 - sumaActual).toFixed(2)}%`, 400));
    }

    const vivienda = await Vivienda.create({
      numeroPuerta,
      coeficiente: coeficienteNum,
      derechoVoto: derechoVoto !== undefined ? derechoVoto : true,
      comunidad
    });

    res.status(201).json({
      success: true,
      data: vivienda,
      sumaCoeficientes: parseFloat((sumaActual + coeficienteNum).toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar vivienda
// @route   PUT /api/viviendas/:id
// @access  Privado/Admin
exports.actualizarVivienda = async (req, res, next) => {
  try {
    let vivienda = await Vivienda.findById(req.params.id);

    if (!vivienda) {
      return next(new ErrorHandler(`Vivienda no encontrada con id ${req.params.id}`, 404));
    }
    
    // Verificar que el usuario tiene permiso para actualizar esta vivienda
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || 
         req.usuario.comunidad._id.toString() !== vivienda.comunidad.toString())) {
      return next(new ErrorHandler('No tienes permiso para actualizar esta vivienda', 403));
    }
    
    // No permitir cambiar la comunidad a menos que sea superadmin
    if (req.body.comunidad && req.usuario.rol !== 'superadmin') {
      delete req.body.comunidad;
    }
    
    // Si se está actualizando el numeroPuerta, verificar que no exista otro con el mismo en la misma comunidad
    if (req.body.numeroPuerta && req.body.numeroPuerta !== vivienda.numeroPuerta) {
      const viviendaExiste = await Vivienda.findOne({ 
        numeroPuerta: req.body.numeroPuerta,
        comunidad: vivienda.comunidad,
        _id: { $ne: req.params.id }
      });
      
      if (viviendaExiste) {
        return next(new ErrorHandler(`Ya existe una vivienda con el número de puerta ${req.body.numeroPuerta} en esta comunidad`, 400));
      }
    }

    // Si se está actualizando el coeficiente, verificar que no exceda el 100%
    if (req.body.coeficiente !== undefined) {
      const nuevoCoeficiente = parseFloat(req.body.coeficiente);
      
      if (isNaN(nuevoCoeficiente) || nuevoCoeficiente <= 0) {
        return next(new ErrorHandler('El coeficiente debe ser un número mayor que 0', 400));
      }
      
      // Calcular la suma actual excluyendo esta vivienda
      const sumaActual = await calcularSumaCoeficientes(vivienda.comunidad, req.params.id);
      const nuevaSuma = sumaActual + nuevoCoeficiente;
      
      // Verificar que no se exceda el 100%
      if (nuevaSuma > 100.001) { // Se usa 100.001 para manejar errores de redondeo
        return next(new ErrorHandler(`La suma de coeficientes excedería el 100%. Suma actual (sin esta vivienda): ${sumaActual.toFixed(2)}%, disponible: ${(100 - sumaActual).toFixed(2)}%`, 400));
      }
      
      // Asegurar que el coeficiente sea un número en el objeto de actualización
      req.body.coeficiente = nuevoCoeficiente;
    }

    vivienda = await Vivienda.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('habitantes', 'nombre email rol');

    // Calcular y devolver la suma total de coeficientes
    const sumaCoeficientes = await calcularSumaCoeficientes(vivienda.comunidad);

    res.status(200).json({
      success: true,
      data: vivienda,
      sumaCoeficientes: parseFloat(sumaCoeficientes.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Asignar usuario a vivienda
// @route   PUT /api/viviendas/:id/asignar-usuario/:usuarioId
// @access  Privado/Admin
exports.asignarUsuarioVivienda = async (req, res, next) => {
  try {
    const vivienda = await Vivienda.findById(req.params.id);
    const usuario = await Usuario.findById(req.params.usuarioId);

    if (!vivienda) {
      return next(new ErrorHandler(`Vivienda no encontrada con id ${req.params.id}`, 404));
    }

    if (!usuario) {
      return next(new ErrorHandler(`Usuario no encontrado con id ${req.params.usuarioId}`, 404));
    }

    // Verificar que el usuario administrador tiene acceso a esta vivienda
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || 
         req.usuario.comunidad._id.toString() !== vivienda.comunidad.toString())) {
      return next(new ErrorHandler('No tienes permiso para modificar esta vivienda', 403));
    }

    // Verificar que el usuario a asignar pertenece a la misma comunidad
    if (usuario.comunidad && usuario.comunidad.toString() !== vivienda.comunidad.toString()) {
      return next(new ErrorHandler('El usuario pertenece a otra comunidad', 400));
    }

    // Si el usuario ya tiene una vivienda asignada, quitarlo de esa vivienda
    if (usuario.vivienda && usuario.vivienda.toString() !== vivienda._id.toString()) {
      await Vivienda.findByIdAndUpdate(
        usuario.vivienda,
        { $pull: { habitantes: usuario._id } }
      );
    }

    // Actualizar el usuario con la vivienda y comunidad asignadas
    usuario.vivienda = vivienda._id;
    usuario.comunidad = vivienda.comunidad;
    await usuario.save();

    // Añadir el usuario a la lista de habitantes de la vivienda
    if (!vivienda.habitantes.includes(usuario._id)) {
      vivienda.habitantes.push(usuario._id);
      await vivienda.save();
    }

    // Obtener la vivienda actualizada con los habitantes populados
    const viviendaActualizada = await Vivienda.findById(vivienda._id)
      .populate('habitantes', 'nombre email rol');

    res.status(200).json({
      success: true,
      message: 'Usuario asignado a vivienda correctamente',
      data: { vivienda: viviendaActualizada, usuario }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar vivienda
// @route   DELETE /api/viviendas/:id
// @access  Privado/Admin
exports.eliminarVivienda = async (req, res, next) => {
  try {
    const vivienda = await Vivienda.findById(req.params.id);

    if (!vivienda) {
      return next(new ErrorHandler(`Vivienda no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar que el usuario tiene permiso para eliminar esta vivienda
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || 
         req.usuario.comunidad._id.toString() !== vivienda.comunidad.toString())) {
      return next(new ErrorHandler('No tienes permiso para eliminar esta vivienda', 403));
    }

    // Actualizar usuarios asociados a esta vivienda
    await Usuario.updateMany(
      { vivienda: vivienda._id },
      { $unset: { vivienda: 1 } }
    );

    await vivienda.deleteOne();

    // Calcular y devolver la suma total de coeficientes
    const sumaCoeficientes = await calcularSumaCoeficientes(vivienda.comunidad);

    res.status(200).json({
      success: true,
      message: 'Vivienda eliminada correctamente',
      sumaCoeficientes: parseFloat(sumaCoeficientes.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
}; 