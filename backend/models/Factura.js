const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la factura es obligatorio'],
    trim: true,
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha de la factura es obligatoria'],
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
  },
  archivoUrl: {
    type: String,
    required: [true, 'La URL del archivo es obligatoria'],
  },
  comunidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comunidad',
    required: [true, 'La comunidad es obligatoria'],
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
}, {
  timestamps: true,
});

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura; 