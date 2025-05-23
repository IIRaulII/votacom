const { Comunidad, Usuario } = require('../models');
const ErrorHandler = require('../utils/errorHandler');
const crypto = require('crypto');

// Función helper para generar código de comunidad único
const generarCodigoComunidad = () => {
  // Generar un string alfanumérico de 8 caracteres
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Obtener todas las comunidades
// @route   GET /api/comunidades
// @access  Privado
exports.getComunidades = async (req, res, next) => {
  try {
    let comunidades;
    
    // Si es superadmin, obtener todas las comunidades con información completa
    if (req.usuario.rol === 'superadmin') {
      comunidades = await Comunidad.find().populate('administradores', 'nombre email');
    } else {
      // Para otros roles, mostrar solo información básica
      comunidades = await Comunidad.find({}, 'nombre direccion codigo');
    }

    res.status(200).json({
      success: true,
      count: comunidades.length,
      data: comunidades
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una comunidad específica
// @route   GET /api/comunidades/:id
// @access  Privado/Admin
exports.getComunidad = async (req, res, next) => {
  try {
    console.log("getComunidad - ID solicitado:", req.params.id);
    console.log("getComunidad - Usuario:", req.usuario._id, "Rol:", req.usuario.rol);
    console.log("getComunidad - Comunidad del usuario:", req.usuario.comunidad);
    
    const comunidad = await Comunidad.findById(req.params.id)
      .populate('administradores', 'nombre email rol');

    if (!comunidad) {
      console.log("getComunidad - Comunidad no encontrada");
      return next(new ErrorHandler(`Comunidad no encontrada con id ${req.params.id}`, 404));
    }
    
    console.log("getComunidad - Comunidad encontrada:", comunidad._id);

    // Verificar que el usuario pertenece a esta comunidad o es superadmin
    // Permitir a cualquier usuario ver su propia comunidad
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || req.usuario.comunidad.toString() !== comunidad._id.toString())) {
      console.log("getComunidad - Acceso denegado. Usuario no pertenece a esta comunidad");
      console.log("getComunidad - ID comunidad usuario:", req.usuario.comunidad ? req.usuario.comunidad.toString() : "No tiene");
      console.log("getComunidad - ID comunidad solicitada:", comunidad._id.toString());
      return next(new ErrorHandler('No tienes permiso para acceder a esta comunidad', 403));
    }

    console.log("getComunidad - Acceso permitido, enviando respuesta");
    res.status(200).json({
      success: true,
      data: comunidad
    });
  } catch (error) {
    console.error("getComunidad - Error:", error);
    next(error);
  }
};

// @desc    Crear una nueva comunidad
// @route   POST /api/comunidades
// @access  Privado/SuperAdmin
exports.crearComunidad = async (req, res, next) => {
  try {
    const { nombre, direccion, cif, administradores } = req.body;

    // Verificar si ya existe una comunidad con el mismo CIF
    const comunidadExiste = await Comunidad.findOne({ cif });
    if (comunidadExiste) {
      return next(new ErrorHandler(`Ya existe una comunidad con el CIF ${cif}`, 400));
    }

    // Generar un código único para la comunidad
    const codigo = generarCodigoComunidad();

    // Crear la comunidad
    const comunidad = await Comunidad.create({
      nombre,
      direccion,
      cif,
      codigo,
      administradores: administradores || [] // Si no se proporcionan administradores, iniciar con array vacío
    });

    // Si hay administradores, actualizar su campo de comunidad
    if (administradores && administradores.length > 0) {
      await Usuario.updateMany(
        { _id: { $in: administradores } },
        { comunidad: comunidad._id, rol: 'admin' }
      );
    }

    res.status(201).json({
      success: true,
      data: comunidad
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una comunidad
// @route   PUT /api/comunidades/:id
// @access  Privado/SuperAdmin o Admin
exports.actualizarComunidad = async (req, res, next) => {
  try {
    let comunidad = await Comunidad.findById(req.params.id);

    if (!comunidad) {
      return next(new ErrorHandler(`Comunidad no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar que el usuario es superadmin o admin de esta comunidad
    if (req.usuario.rol !== 'superadmin' && 
        (!req.usuario.comunidad || 
         req.usuario.comunidad.toString() !== comunidad._id.toString() || 
         req.usuario.rol !== 'admin')) {
      return next(new ErrorHandler('No tienes permiso para actualizar esta comunidad', 403));
    }

    // Si se intenta cambiar el CIF, verificar que no exista ya una comunidad con ese CIF
    if (req.body.cif && req.body.cif !== comunidad.cif) {
      const comunidadExistente = await Comunidad.findOne({ 
        cif: req.body.cif,
        _id: { $ne: req.params.id }
      });
      
      if (comunidadExistente) {
        return next(new ErrorHandler(`Ya existe una comunidad con el CIF ${req.body.cif}`, 400));
      }
    }

    // Manejar administradores si se incluyen en la actualización
    if (req.body.administradores) {
      // Si es superadmin puede actualizar administradores
      if (req.usuario.rol === 'superadmin') {
        // Obtener los administradores actuales de la comunidad
        const administradoresActuales = comunidad.administradores.map(admin => admin.toString());
        
        // Nuevos administradores a agregar (los que están en req.body pero no en la comunidad)
        const nuevosAdmins = req.body.administradores.filter(
          adminId => !administradoresActuales.includes(adminId)
        );
        
        // Administradores a quitar (los que están en la comunidad pero no en req.body)
        const adminsAQuitar = administradoresActuales.filter(
          adminId => !req.body.administradores.includes(adminId)
        );
        
        // Actualizar nuevos administradores
        if (nuevosAdmins.length > 0) {
          await Usuario.updateMany(
            { _id: { $in: nuevosAdmins } },
            { comunidad: comunidad._id, rol: 'admin' }
          );
        }
        
        // Actualizar administradores que se quitan
        if (adminsAQuitar.length > 0) {
          await Usuario.updateMany(
            { _id: { $in: adminsAQuitar } },
            { $unset: { comunidad: "" }, rol: 'vecino' }
          );
        }
      } else {
        // Si no es superadmin, no permite cambiar los administradores
        delete req.body.administradores;
      }
    }

    comunidad = await Comunidad.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('administradores', 'nombre email rol');

    res.status(200).json({
      success: true,
      data: comunidad
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una comunidad
// @route   DELETE /api/comunidades/:id
// @access  Privado/SuperAdmin
exports.eliminarComunidad = async (req, res, next) => {
  try {
    const comunidad = await Comunidad.findById(req.params.id);

    if (!comunidad) {
      return next(new ErrorHandler(`Comunidad no encontrada con id ${req.params.id}`, 404));
    }

    // Solo superadmin puede eliminar comunidades
    if (req.usuario.rol !== 'superadmin') {
      return next(new ErrorHandler('No tienes permiso para eliminar comunidades', 403));
    }

    // Actualizar los usuarios para quitar la referencia a esta comunidad
    await Usuario.updateMany(
      { comunidad: comunidad._id },
      { $unset: { comunidad: "" } }
    );

    // Eliminar la comunidad
    await comunidad.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comunidad eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unirse a una comunidad (para vecinos)
// @route   POST /api/comunidades/unirse
// @access  Privado
exports.unirseComunidad = async (req, res, next) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return next(new ErrorHandler('El código de la comunidad es obligatorio', 400));
    }

    // Buscar la comunidad por el código
    const comunidad = await Comunidad.findOne({ codigo });

    if (!comunidad) {
      return next(new ErrorHandler('Código de comunidad no válido', 404));
    }

    // Si el usuario ya pertenece a una comunidad
    if (req.usuario.comunidad) {
      return next(new ErrorHandler('Ya perteneces a una comunidad. Contacta con el administrador para cambiarte.', 400));
    }

    // Actualizar el usuario con la comunidad y establecer rol como vecino
    const usuario = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { 
        comunidad: comunidad._id,
        rol: 'vecino' // Asegurarnos de que se establece el rol como vecino
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('comunidad', 'nombre direccion codigo');

    res.status(200).json({
      success: true,
      message: `Te has unido a la comunidad ${comunidad.nombre} correctamente`,
      data: { 
        comunidad, 
        usuario 
      }
    });
  } catch (error) {
    next(error);
  }
}; 