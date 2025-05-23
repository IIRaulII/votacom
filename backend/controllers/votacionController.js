const { Votacion, VotoEmitido, Vivienda, Usuario } = require('../models');
const ErrorHandler = require('../utils/errorHandler');

// @desc    Obtener todas las votaciones
// @route   GET /api/votaciones
// @access  Privado
exports.getVotaciones = async (req, res, next) => {
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
    
    const votaciones = await Votacion.find(query)
      .populate('creador', 'nombre email')
      .populate('votos');

    res.status(200).json({
      success: true,
      count: votaciones.length,
      data: votaciones
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una votación por ID
// @route   GET /api/votaciones/:id
// @access  Privado
exports.getVotacion = async (req, res, next) => {
  try {
    const votacion = await Votacion.findById(req.params.id)
      .populate('creador', 'nombre email')
      .populate({
        path: 'votos',
        populate: {
          path: 'vivienda',
          select: 'numeroPuerta coeficiente'
        }
      });

    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: votacion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear nueva votación
// @route   POST /api/votaciones
// @access  Privado/Admin
exports.crearVotacion = async (req, res, next) => {
  try {
    // Añadir el usuario que crea la votación
    req.body.creador = req.usuario.id;
    
    // Verificar que se ha proporcionado una comunidad
    if (!req.body.comunidad) {
      // Si el usuario no es superadmin, usar su comunidad
      if (req.usuario.rol !== 'superadmin') {
        if (!req.usuario.comunidad) {
          return next(new ErrorHandler('No tienes una comunidad asignada para crear votaciones', 400));
        }
        // Asignar el ID de la comunidad del usuario
        req.body.comunidad = typeof req.usuario.comunidad === 'object' 
          ? req.usuario.comunidad._id || req.usuario.comunidad
          : req.usuario.comunidad;
      } else {
        return next(new ErrorHandler('Debes especificar una comunidad para la votación', 400));
      }
    }
    
    // Obtener los IDs como string para comparación correcta
    const comunidadIdSolicitada = req.body.comunidad.toString();
    const usuarioComunidadId = req.usuario.comunidad 
      ? (typeof req.usuario.comunidad === 'object' 
          ? req.usuario.comunidad._id.toString() 
          : req.usuario.comunidad.toString()) 
      : null;
    
    // Verificar que el usuario tiene permiso para crear votaciones en esta comunidad
    if (req.usuario.rol !== 'superadmin' && usuarioComunidadId !== comunidadIdSolicitada) {
      return next(new ErrorHandler('No puedes crear votaciones en otras comunidades', 403));
    }

    const votacion = await Votacion.create(req.body);

    res.status(201).json({
      success: true,
      data: votacion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar votación
// @route   PUT /api/votaciones/:id
// @access  Privado/Admin
exports.actualizarVotacion = async (req, res, next) => {
  try {
    let votacion = await Votacion.findById(req.params.id);

    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar si la votación ya tiene votos
    const tieneVotos = await VotoEmitido.exists({ votacion: votacion._id });

    if (tieneVotos && votacion.estado !== 'pendiente') {
      return next(new ErrorHandler('No se puede modificar una votación que ya ha comenzado o finalizado', 400));
    }

    // Comprobar manualmente la validación de fechas
    const fechaInicio = req.body.fechaInicio ? new Date(req.body.fechaInicio) : votacion.fechaInicio;
    const fechaFin = req.body.fechaFin ? new Date(req.body.fechaFin) : votacion.fechaFin;
    
    if (fechaFin <= fechaInicio) {
      return next(new ErrorHandler('La fecha de fin debe ser posterior a la fecha de inicio', 400));
    }
    
    // Actualizar el documento en lugar de usar findByIdAndUpdate
    Object.keys(req.body).forEach(key => {
      votacion[key] = req.body[key];
    });
    
    await votacion.save();

    res.status(200).json({
      success: true,
      data: votacion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar votación
// @route   PUT /api/votaciones/:id/iniciar
// @access  Privado/Admin
exports.iniciarVotacion = async (req, res, next) => {
  try {
    const votacion = await Votacion.findById(req.params.id);

    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }

    if (votacion.estado !== 'pendiente') {
      return next(new ErrorHandler('La votación ya ha sido iniciada o finalizada', 400));
    }

    votacion.estado = 'activa';
    votacion.fechaInicio = Date.now();
    await votacion.save();

    res.status(200).json({
      success: true,
      message: 'Votación iniciada correctamente',
      data: votacion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finalizar votación
// @route   PUT /api/votaciones/:id/finalizar
// @access  Privado/Admin
exports.finalizarVotacion = async (req, res, next) => {
  try {
    const votacion = await Votacion.findById(req.params.id).populate('votos');

    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }

    if (votacion.estado !== 'activa') {
      return next(new ErrorHandler('La votación no está activa', 400));
    }

    votacion.estado = 'finalizada';
    await votacion.save();

    res.status(200).json({
      success: true,
      message: 'Votación finalizada correctamente',
      data: votacion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Emitir voto
// @route   POST /api/votaciones/:id/votar
// @access  Privado
exports.emitirVoto = async (req, res, next) => {
  try {
    const { opcionId } = req.body;
    const votacionId = req.params.id;
    
    // Buscar la votación
    const votacion = await Votacion.findById(votacionId);
    
    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${votacionId}`, 404));
    }
    
    if (votacion.estado !== 'activa') {
      return next(new ErrorHandler('La votación no está activa', 400));
    }
    
    // Verificar si la opción existe en la votación
    const opcionExiste = votacion.opciones.some(opcion => opcion._id.toString() === opcionId);
    if (!opcionExiste) {
      return next(new ErrorHandler(`Opción no encontrada en esta votación`, 404));
    }
    
    // Verificar si el usuario tiene vivienda asignada
    if (!req.usuario.vivienda) {
      return next(new ErrorHandler('No tienes una vivienda asignada para poder votar', 400));
    }
    
    // Verificar si la vivienda tiene derecho a voto
    const vivienda = await Vivienda.findById(req.usuario.vivienda);
    if (!vivienda || !vivienda.derechoVoto) {
      return next(new ErrorHandler('Tu vivienda no tiene derecho a voto', 403));
    }
    
    // Verificar si la vivienda ya ha votado
    const votoExistente = await VotoEmitido.findOne({
      votacion: votacionId,
      vivienda: req.usuario.vivienda
    });
    
    if (votoExistente) {
      return next(new ErrorHandler('Tu vivienda ya ha emitido un voto en esta votación', 400));
    }
    
    // Crear el voto con la comunidad asignada
    const voto = await VotoEmitido.create({
      votacion: votacionId,
      vivienda: req.usuario.vivienda,
      usuario: req.usuario.id,
      opcionElegida: opcionId,
      comunidad: votacion.comunidad // Asignar la comunidad de la votación al voto
    });

    // Obtener la votación actualizada con los votos para devolverla
    const votacionActualizada = await Votacion.findById(votacionId)
      .populate('creador', 'nombre email')
      .populate({
        path: 'votos',
        populate: {
          path: 'vivienda',
          select: 'numeroPuerta coeficiente'
        }
      });
    
    // Preparar resultados si están habilitados los resultados parciales
    let resultadosParciales = null;
    if (votacionActualizada.mostrarResultadosParciales) {
      // Obtener todos los votos emitidos para esta votación
      const votos = await VotoEmitido.find({ votacion: votacionId })
        .populate('vivienda', 'coeficiente numeroPuerta');
      
      // Obtener el número total de viviendas con derecho a voto de la misma comunidad
      const viviendasConDerechoVoto = await Vivienda.countDocuments({ 
        derechoVoto: true,
        comunidad: votacionActualizada.comunidad
      });
      
      // Calcular el porcentaje de participación
      const participacion = viviendasConDerechoVoto > 0 
        ? parseFloat(((votos.length / viviendasConDerechoVoto) * 100).toFixed(2)) 
        : 0;
      
      // Inicializar contadores para cada opción
      let resultados = {};
      let votosValidos = 0;
      
      votacionActualizada.opciones.forEach(opcion => {
        resultados[opcion._id] = {
          opcion: opcion.texto,
          votos: 0,
          porcentaje: 0,
          coeficiente: 0
        };
      });
      
      // Contar votos según el sistema de recuento
      if (votacionActualizada.sistemaRecuento === 'vivienda' || votacionActualizada.sistemaRecuento === 'simple') {
        // Un propietario, un voto
        votos.forEach(voto => {
          if (resultados[voto.opcionElegida]) {
            resultados[voto.opcionElegida].votos += 1;
            votosValidos += 1;
          }
        });
      } else if (votacionActualizada.sistemaRecuento === 'coeficiente') {
        // Ponderado por coeficiente de propiedad
        votos.forEach(voto => {
          if (resultados[voto.opcionElegida] && voto.vivienda) {
            const coeficiente = voto.vivienda.coeficiente || 0;
            resultados[voto.opcionElegida].coeficiente += coeficiente;
            votosValidos += 1;
          }
        });
      }
      
      // Calcular porcentajes
      if ((votacionActualizada.sistemaRecuento === 'vivienda' || votacionActualizada.sistemaRecuento === 'simple') && votosValidos > 0) {
        Object.keys(resultados).forEach(opcionId => {
          resultados[opcionId].porcentaje = (resultados[opcionId].votos / votosValidos) * 100;
        });
      } else if (votacionActualizada.sistemaRecuento === 'coeficiente') {
        // Calcular el total de coeficiente
        const totalCoeficiente = Object.values(resultados).reduce(
          (sum, resultado) => sum + resultado.coeficiente, 0
        );
        
        if (totalCoeficiente > 0) {
          Object.keys(resultados).forEach(opcionId => {
            resultados[opcionId].porcentaje = (resultados[opcionId].coeficiente / totalCoeficiente) * 100;
          });
        }
      }
      
      // Convertir el objeto a un array para facilitar su uso en el frontend
      const resultadosArray = Object.keys(resultados).map(opcionId => ({
        id: opcionId,
        ...resultados[opcionId],
        porcentaje: parseFloat(resultados[opcionId].porcentaje.toFixed(2))
      }));
      
      // Ordenar resultados por cantidad de votos o coeficiente (de mayor a menor)
      resultadosArray.sort((a, b) => {
        if (votacionActualizada.sistemaRecuento === 'vivienda' || votacionActualizada.sistemaRecuento === 'simple') {
          return b.votos - a.votos;
        } else {
          return b.coeficiente - a.coeficiente;
        }
      });
      
      resultadosParciales = {
        sistemaRecuento: votacionActualizada.sistemaRecuento,
        totalVotos: votosValidos,
        participacion: participacion,
        viviendasConDerechoVoto: viviendasConDerechoVoto,
        totalViviendas: await Vivienda.countDocuments({ comunidad: votacionActualizada.comunidad }),
        resultados: resultadosArray
      };
    }
    
    res.status(201).json({
      success: true,
      message: 'Voto emitido correctamente',
      data: {
        voto,
        votacion: votacionActualizada,
        resultadosParciales
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener resultados de una votación
// @route   GET /api/votaciones/:id/resultados
// @access  Privado
exports.getResultadosVotacion = async (req, res, next) => {
  try {
    const votacion = await Votacion.findById(req.params.id)
      .populate({
        path: 'votos',
        populate: {
          path: 'vivienda',
          select: 'numeroPuerta coeficiente'
        }
      });

    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }

    // Verificar si la votación ha finalizado (por estado o por fecha)
    const fechaActual = new Date();
    const fechaFin = new Date(votacion.fechaFin);
    const haTerminado = votacion.estado === 'finalizada' || fechaFin < fechaActual;

    // Si la votación debería estar finalizada por fecha pero no lo está por estado, 
    // actualizarla automáticamente
    if (fechaFin < fechaActual && votacion.estado !== 'finalizada') {
      votacion.estado = 'finalizada';
      await votacion.save();
    }

    // Obtener todos los votos emitidos para esta votación, incluso si aún no está finalizada
    // Esto permite mostrar resultados parciales o preliminares
    const votos = await VotoEmitido.find({ votacion: votacion._id })
      .populate('vivienda', 'coeficiente numeroPuerta');

    // Obtener el número total de viviendas con derecho a voto de la misma comunidad
    const viviendasConDerechoVoto = await Vivienda.countDocuments({ 
      derechoVoto: true,
      comunidad: votacion.comunidad 
    });
    
    // Obtener el número total de viviendas en la comunidad
    const totalViviendas = await Vivienda.countDocuments({
      comunidad: votacion.comunidad
    });

    // Preparar los resultados según el sistema de recuento
    let resultados = {};
    const totalVotos = votos.length;
    let votosValidos = 0;

    // Calcular el porcentaje de participación
    const participacion = viviendasConDerechoVoto > 0 
      ? parseFloat(((totalVotos / viviendasConDerechoVoto) * 100).toFixed(2)) 
      : 0;

    // Inicializar contadores para cada opción
    votacion.opciones.forEach(opcion => {
      resultados[opcion._id] = {
        opcion: opcion.texto,
        votos: 0,
        porcentaje: 0,
        coeficiente: 0
      };
    });

    // Contar votos según el sistema de recuento
    if (votacion.sistemaRecuento === 'vivienda' || votacion.sistemaRecuento === 'simple') {
      // Un propietario, un voto
      votos.forEach(voto => {
        if (resultados[voto.opcionElegida]) {
          resultados[voto.opcionElegida].votos += 1;
          votosValidos += 1;
        }
      });
    } else if (votacion.sistemaRecuento === 'coeficiente') {
      // Ponderado por coeficiente de propiedad
      votos.forEach(voto => {
        if (resultados[voto.opcionElegida] && voto.vivienda) {
          const coeficiente = voto.vivienda.coeficiente || 0;
          resultados[voto.opcionElegida].coeficiente += coeficiente;
          votosValidos += 1;
        }
      });
    }

    // Calcular porcentajes
    if ((votacion.sistemaRecuento === 'vivienda' || votacion.sistemaRecuento === 'simple') && votosValidos > 0) {
      Object.keys(resultados).forEach(opcionId => {
        resultados[opcionId].porcentaje = (resultados[opcionId].votos / votosValidos) * 100;
      });
    } else if (votacion.sistemaRecuento === 'coeficiente') {
      // Calcular el total de coeficiente
      const totalCoeficiente = Object.values(resultados).reduce(
        (sum, resultado) => sum + resultado.coeficiente, 0
      );
      
      if (totalCoeficiente > 0) {
        Object.keys(resultados).forEach(opcionId => {
          resultados[opcionId].porcentaje = (resultados[opcionId].coeficiente / totalCoeficiente) * 100;
        });
      }
    }

    // Convertir el objeto a un array para facilitar su uso en el frontend
    const resultadosArray = Object.keys(resultados).map(opcionId => ({
      id: opcionId,
      ...resultados[opcionId],
      porcentaje: parseFloat(resultados[opcionId].porcentaje.toFixed(2))
    }));
    
    // Ordenar resultados por cantidad de votos o coeficiente (de mayor a menor)
    resultadosArray.sort((a, b) => {
      if (votacion.sistemaRecuento === 'vivienda' || votacion.sistemaRecuento === 'simple') {
        return b.votos - a.votos;
      } else {
        return b.coeficiente - a.coeficiente;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        sistemaRecuento: votacion.sistemaRecuento,
        totalVotos: votosValidos,
        participacion: participacion,
        viviendasConDerechoVoto: viviendasConDerechoVoto,
        totalViviendas: totalViviendas,
        resultados: resultadosArray
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verificar si un usuario ha votado en una votación
// @route   GET /api/votaciones/:id/verificar-voto
// @access  Privado
exports.verificarVoto = async (req, res, next) => {
  try {
    const votacionId = req.params.id;
    const usuarioId = req.usuario.id;
    
    // Obtener la información del usuario para conocer su vivienda y rol
    const usuario = await Usuario.findById(usuarioId).select('vivienda rol');
    
    if (!usuario) {
      return next(new ErrorHandler('Usuario no encontrado', 404));
    }
    
    // Si es superadmin, verificar si hay votos en la votación en lugar de verificar si el usuario ha votado
    if (usuario.rol === 'superadmin') {
      // Contar votos en la votación
      const votosCount = await VotoEmitido.countDocuments({ votacion: votacionId });
      
      // Si hay votos, indicar que no es "aplazada sin votos"
      return res.status(200).json({
        success: true,
        yaVoto: votosCount > 0, // Si hay votos, marcar como true para que no se muestre como "aplazada"
        message: votosCount > 0 ? 'La votación tiene votos' : 'La votación no tiene votos',
        esSuperadmin: true
      });
    }
    
    // Para usuarios normales, verificar si el usuario tiene vivienda asignada
    if (!usuario.vivienda) {
      return res.status(200).json({
        success: true,
        yaVoto: false,
        message: 'El usuario no tiene vivienda asignada'
      });
    }
    
    // Buscar si existe un voto de la vivienda del usuario para esta votación
    const votoExistente = await VotoEmitido.findOne({
      votacion: votacionId,
      vivienda: usuario.vivienda
    });
    
    const yaVoto = !!votoExistente;
    
    return res.status(200).json({
      success: true,
      yaVoto,
      message: yaVoto ? 'El usuario ya ha emitido su voto' : 'El usuario aún no ha votado'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar votación
// @route   DELETE /api/votaciones/:id
// @access  Privado/Admin
exports.eliminarVotacion = async (req, res, next) => {
  try {
    const votacion = await Votacion.findById(req.params.id);
    
    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${req.params.id}`, 404));
    }
    
    // Verificar si hay votos emitidos para esta votación
    const votosEmitidos = await VotoEmitido.countDocuments({ votacion: req.params.id });
    
    // Eliminar votos emitidos si existen
    if (votosEmitidos > 0) {
      await VotoEmitido.deleteMany({ votacion: req.params.id });
    }
    
    // Eliminar la votación
    await votacion.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Votación eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener informe de participación de una votación
// @route   GET /api/votaciones/:id/informe-participacion
// @access  Privado (solo admin)
exports.getInformeParticipacion = async (req, res, next) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'superadmin') {
      return next(new ErrorHandler('No tienes permiso para acceder a este informe', 403));
    }

    const votacionId = req.params.id;
    
    // Obtener la votación
    const votacion = await Votacion.findById(votacionId)
      .populate('creador', 'nombre email');
      
    if (!votacion) {
      return next(new ErrorHandler(`Votación no encontrada con id ${votacionId}`, 404));
    }
    
    // Obtener todas las viviendas de la comunidad con sus habitantes
    const viviendas = await Vivienda.find({ comunidad: votacion.comunidad })
      .populate('habitantes', 'nombre email');
      
    // Obtener todos los votos de esta votación
    const votos = await VotoEmitido.find({ votacion: votacionId })
      .populate('usuario', 'nombre email')
      .populate('vivienda', 'numeroPuerta coeficiente');
      
    // Mapear las opciones para tener acceso rápido al texto de cada opción
    const opcionesMap = {};
    votacion.opciones.forEach(opcion => {
      opcionesMap[opcion._id.toString()] = opcion.texto;
    });
    
    // Preparar los datos de cada vivienda con información de voto
    const viviendasConVotos = viviendas.map(vivienda => {
      // Buscar si esta vivienda emitió voto
      const voto = votos.find(v => 
        v.vivienda && 
        (v.vivienda._id.toString() === vivienda._id.toString() || 
         v.vivienda.toString() === vivienda._id.toString())
      );
      
      // Determinar el "propietario" (primer habitante o valor por defecto)
      const propietario = vivienda.habitantes && vivienda.habitantes.length > 0 
        ? vivienda.habitantes[0] 
        : { nombre: 'No asignado', email: '' };
      
      // Crear objeto con datos de la vivienda
      const viviendaData = {
        _id: vivienda._id,
        numeroPuerta: vivienda.numeroPuerta,
        coeficiente: vivienda.coeficiente,
        propietario: {
          nombre: propietario.nombre,
          email: propietario.email
        },
        derechoVoto: vivienda.derechoVoto || false,
        voto: null
      };
      
      // Si hay voto, añadir información
      if (voto) {
        viviendaData.voto = {
          _id: voto._id,
          opcionElegida: voto.opcionElegida,
          opcionTexto: opcionesMap[voto.opcionElegida.toString()] || 'Opción desconocida',
          fechaVoto: voto.createdAt,
          usuario: voto.usuario
        };
      }
      
      return viviendaData;
    });
    
    // Preparar respuesta
    res.status(200).json({
      success: true,
      data: {
        votacion: {
          _id: votacion._id,
          titulo: votacion.titulo,
          descripcion: votacion.descripcion,
          fechaInicio: votacion.fechaInicio,
          fechaFin: votacion.fechaFin,
          estado: votacion.estado,
          sistemaRecuento: votacion.sistemaRecuento,
          tipoMayoria: votacion.tipoMayoria
        },
        viviendas: viviendasConVotos,
        estadisticas: {
          totalViviendas: viviendas.length,
          viviendasConDerechoVoto: viviendas.filter(v => v.derechoVoto).length,
          totalVotos: votos.length,
          participacion: viviendas.filter(v => v.derechoVoto).length > 0 
            ? (votos.length / viviendas.filter(v => v.derechoVoto).length) * 100 
            : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 