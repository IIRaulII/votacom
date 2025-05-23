const express = require('express');
const router = express.Router();
const {
  getComunidades,
  getComunidad,
  crearComunidad,
  actualizarComunidad,
  eliminarComunidad,
  unirseComunidad
} = require('../controllers/comunidadController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');

// Rutas para comunidades
router.route('/')
  .get(proteger, getComunidades)  // Permitir a todos los usuarios autenticados ver comunidades
  .post(proteger, autorizar('superadmin'), crearComunidad); // Solo superadmin puede crear

router.route('/:id')
  .get(proteger, getComunidad)
  .put(proteger, actualizarComunidad)
  .delete(proteger, autorizar('superadmin'), eliminarComunidad);

// Ruta para que vecinos se unan a una comunidad
router.post('/unirse', proteger, unirseComunidad);

module.exports = router; 