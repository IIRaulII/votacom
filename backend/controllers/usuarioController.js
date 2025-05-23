const { Usuario, Vivienda } = require('../models');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Privado/Admin
exports.getUsuarios = async (req, res, next) => {
  try {
    // Construir la consulta con filtros
    const filtro = {};
    
    // Filtro por comunidad si se proporciona
    if (req.query.comunidad) {
      filtro.comunidad = req.query.comunidad;
    } else if (req.user && req.user.rol !== 'superadmin' && req.user.comunidad) {
      // Si no es superadmin, solo mostrar usuarios de su comunidad
      filtro.comunidad = req.user.comunidad;
    }
    
    const usuarios = await Usuario.find(filtro)
      .populate('vivienda', 'numeroPuerta coeficiente derechoVoto')
      .populate('comunidad', 'nombre');
    
    res.status(200).json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/usuarios/:id
// @access  Privado/Admin
exports.getUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id).populate('vivienda', 'numeroPuerta coeficiente derechoVoto');

    if (!usuario) {
      return next(new ErrorHandler(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nuevo usuario
// @route   POST /api/usuarios
// @access  Privado/Admin
exports.crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, rol, viviendaId, comunidadId } = req.body;

    const nuevoUsuario = {
      nombre,
      email,
      password,
      ...(rol && { rol })
    };

    // Asignar comunidad
    if (comunidadId) {
      nuevoUsuario.comunidad = comunidadId;
    } else if (req.user.rol !== 'superadmin' && req.user.comunidad) {
      // Si no es superadmin, asignar la comunidad del admin que lo crea
      nuevoUsuario.comunidad = req.user.comunidad;
    }

    // Si se proporciona un ID de vivienda, verificar y asignar
    if (viviendaId) {
      const vivienda = await Vivienda.findById(viviendaId);
      if (!vivienda) {
        return next(new ErrorHandler(`Vivienda no encontrada con id ${viviendaId}`, 404));
      }
      nuevoUsuario.vivienda = viviendaId;
      
      // Si la vivienda tiene comunidad, asegurarse de que el usuario tenga la misma
      if (vivienda.comunidad) {
        nuevoUsuario.comunidad = vivienda.comunidad;
      }
    }

    const usuario = await Usuario.create(nuevoUsuario);

    // Si se asignó vivienda, actualizar la lista de habitantes
    if (viviendaId) {
      await Vivienda.findByIdAndUpdate(
        viviendaId,
        { $addToSet: { habitantes: usuario._id } }
      );
    }

    // Si el usuario es administrador y tiene comunidad asignada, actualizamos la lista de administradores de la comunidad
    if (usuario.rol === 'admin' && usuario.comunidad) {
      const { Comunidad } = require('../models');
      console.log(`Añadiendo nuevo admin ${usuario._id} a los administradores de la comunidad ${usuario.comunidad}`);
      await Comunidad.findByIdAndUpdate(
        usuario.comunidad,
        { $addToSet: { administradores: usuario._id } }
      );
    }

    res.status(201).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Privado/Admin
exports.actualizarUsuario = async (req, res, next) => {
  try {
    let usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return next(new ErrorHandler(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    // Eliminar campo password si está presente
    const datosActualizacion = { ...req.body };
    delete datosActualizacion.password;

    // Manejar la asignación de comunidad
    if (req.body.comunidadId !== undefined) {
      datosActualizacion.comunidad = req.body.comunidadId || null;
    }

    // Verificar si se está cambiando el rol a/desde 'admin'
    const rolAnterior = usuario.rol;
    const rolNuevo = datosActualizacion.rol;
    const cambioDeRol = rolAnterior !== rolNuevo;
    const seConvierteEnAdmin = rolNuevo === 'admin';
    const dejaDeSerAdmin = rolAnterior === 'admin' && rolNuevo !== 'admin';

    // Guardar referencia a la comunidad
    const comunidadId = datosActualizacion.comunidad || usuario.comunidad;

    // Manejar la asignación de vivienda
    const viviendaAnterior = usuario.vivienda;
    const nuevaViviendaId = req.body.viviendaId;

    // Si viene una nueva vivienda o se está eliminando la vivienda
    if (nuevaViviendaId !== undefined) {
      // Si se está eliminando la vivienda (asignando a null/vacío)
      if (!nuevaViviendaId) {
        console.log(`Eliminando asignación de vivienda al usuario ${usuario._id}`);
        // Eliminar la vivienda del usuario
        datosActualizacion.vivienda = null;
        
        // Eliminar el usuario de la lista de habitantes de la vivienda anterior si existía
        if (viviendaAnterior) {
          await Vivienda.findByIdAndUpdate(
            viviendaAnterior,
            { $pull: { habitantes: usuario._id } }
          );
          console.log(`Usuario ${usuario._id} eliminado de los habitantes de la vivienda ${viviendaAnterior}`);
        }
      } else {
        console.log(`Asignando nueva vivienda ${nuevaViviendaId} al usuario ${usuario._id}`);
        // Verificar que la nueva vivienda existe
        const nuevaVivienda = await Vivienda.findById(nuevaViviendaId);
        if (!nuevaVivienda) {
          return next(new ErrorHandler(`Vivienda no encontrada con id ${nuevaViviendaId}`, 404));
        }
        
        // Asignar la nueva vivienda al usuario
        datosActualizacion.vivienda = nuevaViviendaId;
        
        // Si la vivienda tiene comunidad, asegurarse de que el usuario tenga la misma
        if (nuevaVivienda.comunidad) {
          datosActualizacion.comunidad = nuevaVivienda.comunidad;
        }
        
        // Eliminar el usuario de la vivienda anterior si existía
        if (viviendaAnterior && viviendaAnterior.toString() !== nuevaViviendaId) {
          await Vivienda.findByIdAndUpdate(
            viviendaAnterior,
            { $pull: { habitantes: usuario._id } }
          );
          console.log(`Usuario ${usuario._id} eliminado de los habitantes de la vivienda anterior ${viviendaAnterior}`);
        }
        
        // Añadir el usuario a la lista de habitantes de la nueva vivienda
        await Vivienda.findByIdAndUpdate(
          nuevaViviendaId,
          { $addToSet: { habitantes: usuario._id } }
        );
        console.log(`Usuario ${usuario._id} añadido a los habitantes de la vivienda ${nuevaViviendaId}`);
      }
    }

    // Actualizar el usuario con todos los datos
    usuario = await Usuario.findByIdAndUpdate(req.params.id, datosActualizacion, {
      new: true,
      runValidators: true
    }).populate('vivienda', 'numeroPuerta coeficiente derechoVoto')
      .populate('comunidad', 'nombre');

    // Gestionar la sincronización con el array de administradores de la comunidad
    if (cambioDeRol && comunidadId) {
      const { Comunidad } = require('../models');
      
      if (seConvierteEnAdmin) {
        // Si un usuario se convierte en admin, añadirlo a administradores de la comunidad
        console.log(`Añadiendo usuario ${usuario._id} a los administradores de la comunidad ${comunidadId}`);
        await Comunidad.findByIdAndUpdate(
          comunidadId,
          { $addToSet: { administradores: usuario._id } }
        );
      } else if (dejaDeSerAdmin) {
        // Si un usuario deja de ser admin, quitarlo de administradores de la comunidad
        console.log(`Quitando usuario ${usuario._id} de los administradores de la comunidad ${comunidadId}`);
        await Comunidad.findByIdAndUpdate(
          comunidadId,
          { $pull: { administradores: usuario._id } }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    next(error);
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/usuarios/:id
// @access  Privado/Admin
exports.eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return next(new ErrorHandler(`Usuario no encontrado con id ${req.params.id}`, 404));
    }

    // Si tiene vivienda asignada, quitar de la lista de habitantes
    if (usuario.vivienda) {
      await Vivienda.findByIdAndUpdate(
        usuario.vivienda,
        { $pull: { habitantes: usuario._id } }
      );
    }

    await usuario.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
}; 