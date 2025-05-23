const express = require('express');
const router = express.Router();
const {
  getViviendas,
  getVivienda,
  crearVivienda,
  actualizarVivienda,
  eliminarVivienda,
  asignarUsuarioVivienda
} = require('../controllers/viviendaController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para administradores y superadmin
router
  .route('/')
  .get(getViviendas)
  .post(autorizar('admin', 'superadmin'), crearVivienda);

router
  .route('/:id')
  .get(getVivienda)
  .put(autorizar('admin', 'superadmin'), actualizarVivienda)
  .delete(autorizar('admin', 'superadmin'), eliminarVivienda);

// Ruta para asignar usuario a vivienda
router.put(
  '/:id/asignar-usuario/:usuarioId',
  autorizar('admin', 'superadmin'),
  asignarUsuarioVivienda
);

module.exports = router; 