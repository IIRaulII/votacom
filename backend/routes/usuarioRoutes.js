const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  getUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para administradores y superadmin
router
  .route('/')
  .get(autorizar('admin', 'superadmin'), getUsuarios)
  .post(autorizar('admin', 'superadmin'), crearUsuario);

router
  .route('/:id')
  .get(autorizar('admin', 'superadmin'), getUsuario)
  .put(autorizar('admin', 'superadmin'), actualizarUsuario)
  .delete(autorizar('admin', 'superadmin'), eliminarUsuario);

module.exports = router; 