const cron = require('node-cron');
const { Votacion } = require('../models');
const logger = console;

/**
 * Tarea programada para verificar y finalizar automáticamente votaciones
 * cuando lleguen a su fecha de fin
 */
const finalizarVotacionesVencidas = async () => {
  try {
    logger.info('Ejecutando tarea de finalización automática de votaciones');
    
    const ahora = new Date();
    
    // Buscar votaciones activas cuya fecha de fin ya ha pasado
    const votacionesVencidas = await Votacion.find({
      estado: 'activa',
      fechaFin: { $lte: ahora }
    });
    
    logger.info(`Se encontraron ${votacionesVencidas.length} votaciones para finalizar automáticamente`);
    
    // Finalizar cada votación
    let actualizadas = 0;
    
    for (const votacion of votacionesVencidas) {
      try {
        votacion.estado = 'finalizada';
        await votacion.save();
        actualizadas++;
        logger.info(`Votación ${votacion._id} (${votacion.titulo}) finalizada automáticamente`);
      } catch (err) {
        logger.error(`Error al finalizar automáticamente la votación ${votacion._id}: ${err.message}`);
      }
    }
    
    logger.info(`Finalización automática completada. ${actualizadas} votaciones actualizadas.`);
  } catch (err) {
    logger.error(`Error en tarea de finalización automática: ${err.message}`);
  }
};

/**
 * Inicializa todas las tareas programadas
 */
const iniciarTareasProgramadas = () => {
  // Verificar votaciones cada 10 minutos en lugar de cada minuto
  cron.schedule('*/10 * * * *', finalizarVotacionesVencidas);
  
  logger.info('Tareas programadas iniciadas correctamente');
};

module.exports = {
  iniciarTareasProgramadas,
  // Exportar funciones individuales para testing
  finalizarVotacionesVencidas
}; 