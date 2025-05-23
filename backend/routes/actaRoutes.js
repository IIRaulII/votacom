const express = require('express');
const router = express.Router();
const {
  getActas,
  getActa,
  crearActa,
  eliminarActa
} = require('../controllers/actaController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para actas
router
  .route('/')
  .get(getActas)
  .post(autorizar('admin', 'superadmin'), upload.single('archivo'), crearActa);

router
  .route('/:id')
  .get(getActa)
  .delete(autorizar('admin', 'superadmin'), eliminarActa);

module.exports = router; 