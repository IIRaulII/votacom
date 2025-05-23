const express = require('express');
const router = express.Router();
const {
  registro,
  login,
  logout,
  getUsuarioActual,
  actualizarPerfil
} = require('../controllers/authController');
const { proteger } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/registro', registro);
router.post('/login', login);
router.get('/logout', logout);

// Rutas protegidas
router.get('/me', proteger, getUsuarioActual);
router.put('/actualizar-perfil', proteger, actualizarPerfil);

module.exports = router; 