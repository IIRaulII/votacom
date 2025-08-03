const express = require('express');
const router = express.Router();
const {
  getFacturas,
  getFactura,
  crearFactura,
  eliminarFactura
} = require('../controllers/facturaController');
const { proteger, autorizar } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadFacturaMiddleware');

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para facturas
router
  .route('/')
  .get(getFacturas)
  .post(autorizar('admin', 'superadmin'), upload.single('archivo'), crearFactura);

router
  .route('/:id')
  .get(getFactura)
  .delete(autorizar('admin', 'superadmin'), eliminarFactura);

module.exports = router; 