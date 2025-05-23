const express = require('express');
const router = express.Router();
const {
  getVotaciones,
  getVotacion,
  crearVotacion,
  actualizarVotacion,
  iniciarVotacion,
  finalizarVotacion,
  emitirVoto,
  getResultadosVotacion,
  eliminarVotacion,
  getInformeParticipacion,
  verificarVoto
} = require('../controllers/votacionController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para votaciones
router
  .route('/')
  .get(getVotaciones)
  .post(autorizar('admin', 'superadmin'), crearVotacion);

router
  .route('/:id')
  .get(getVotacion)
  .put(autorizar('admin', 'superadmin'), actualizarVotacion)
  .delete(autorizar('admin', 'superadmin'), eliminarVotacion);

// Rutas adicionales
router.put('/:id/iniciar', autorizar('admin', 'superadmin'), iniciarVotacion);
router.put('/:id/finalizar', autorizar('admin', 'superadmin'), finalizarVotacion);
router.post('/:id/votar', emitirVoto);
router.get('/:id/resultados', getResultadosVotacion);
router.get('/:id/verificar-voto', verificarVoto);
router.get('/:id/informe-participacion', autorizar('admin', 'superadmin'), getInformeParticipacion);

module.exports = router; 