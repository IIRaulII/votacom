const jwt = require('jsonwebtoken');
const { Usuario, Comunidad, Vivienda } = require('../models');
const ErrorHandler = require('../utils/errorHandler');
const config = require('../config/config');
const bcryptjs = require('bcryptjs');

// Generar token JWT y establecer cookie
const enviarTokenRespuesta = (usuario, statusCode, res) => {
  // Generar token
  const token = jwt.sign({ id: usuario._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });

  // Opciones de cookie
  const options = {
    expires: new Date(
      Date.now() + config.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: config.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        vivienda: usuario.vivienda,
        comunidad: usuario.comunidad
      }
    });
};

// @desc    Registro de usuario
// @route   POST /api/auth/registro
// @access  Público
exports.registro = async (req, res, next) => {
  try {
    const { nombre, email, password, idVivienda, codigoComunidad } = req.body;

    // Verificar si el email ya está registrado
    const usuarioExiste = await Usuario.findOne({ email });
    if (usuarioExiste) {
      return next(new ErrorHandler('El email ya está registrado', 400));
    }

    let comunidadId = null;
    let viviendaId = null;

    // Si se proporciona un código de comunidad, buscar la comunidad
    if (codigoComunidad) {
      const comunidad = await Comunidad.findOne({ codigo: codigoComunidad });
      if (!comunidad) {
        return next(new ErrorHandler('Código de comunidad no válido', 400));
      }
      comunidadId = comunidad._id;
    }

    // Si se proporciona un ID de vivienda, verificar que exista
    if (idVivienda) {
      try {
        const vivienda = await Vivienda.findById(idVivienda);
        if (!vivienda) {
          return next(new ErrorHandler('ID de vivienda no válido', 400));
        }
        viviendaId = vivienda._id;
        
        // Si la vivienda tiene comunidad, usar esa comunidad para el usuario
        if (vivienda.comunidad) {
          comunidadId = vivienda.comunidad;
        }
      } catch (err) {
        return next(new ErrorHandler('ID de vivienda no válido', 400));
      }
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      comunidad: comunidadId,
      vivienda: viviendaId
    });

    // Si el usuario se ha registrado con un código de comunidad o vivienda, es un vecino
    if (comunidadId || viviendaId) {
      usuario.rol = 'vecino';
    } else {
      // Si es el primer usuario del sistema, asignarle rol de superadmin
      const totalUsuarios = await Usuario.countDocuments({});
      if (totalUsuarios === 1) {
        usuario.rol = 'superadmin';
      }
    }

    // Si se asignó vivienda, actualizar la lista de habitantes
    if (viviendaId) {
      await Vivienda.findByIdAndUpdate(
        viviendaId,
        { $addToSet: { habitantes: usuario._id } }
      );
    }

    await usuario.save();

    enviarTokenRespuesta(usuario, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Público
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return next(new ErrorHandler('Por favor, introduce email y contraseña', 400));
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      return next(new ErrorHandler('Credenciales inválidas', 401));
    }

    // Verificar contraseña
    const esPasswordCorrecta = await usuario.compararPassword(password);

    if (!esPasswordCorrecta) {
      return next(new ErrorHandler('Credenciales inválidas', 401));
    }

    enviarTokenRespuesta(usuario, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Cerrar sesión
// @route   GET /api/auth/logout
// @access  Privado
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Privado
exports.getUsuarioActual = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .populate('vivienda')
      .populate('comunidad', 'nombre direccion codigo');

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar perfil del usuario actual
// @route   PUT /api/auth/actualizar-perfil
// @access  Privado
exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, password } = req.body;
    
    // Preparar datos para actualización
    const datosActualizacion = {};
    
    // Actualizar solo los campos proporcionados
    if (nombre) {
      datosActualizacion.nombre = nombre;
    }
    
    // Manejar actualización de contraseña si se proporciona
    if (password) {
      // Validar longitud mínima de la contraseña
      if (password.length < 6) {
        return next(new ErrorHandler('La contraseña debe tener al menos 6 caracteres', 400));
      }
      
      const salt = await bcryptjs.genSalt(10);
      datosActualizacion.password = await bcryptjs.hash(password, salt);
    }
    
    // Actualizar usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      datosActualizacion,
      {
        new: true,
        runValidators: true
      }
    ).populate('vivienda').populate('comunidad', 'nombre direccion codigo');
    
    res.status(200).json({
      success: true,
      data: usuarioActualizado
    });
  } catch (error) {
    next(error);
  }
}; 