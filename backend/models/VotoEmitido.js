const mongoose = require('mongoose');

const votoEmitidoSchema = new mongoose.Schema({
  votacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Votacion',
    required: true,
  },
  vivienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vivienda',
    required: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  opcionElegida: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  comunidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comunidad',
    required: true,
  },
  fechaEmision: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Asegurar que solo pueda existir un voto por vivienda y votación
votoEmitidoSchema.index(
  { vivienda: 1, votacion: 1 }, 
  { unique: true }
);

const VotoEmitido = mongoose.model('VotoEmitido', votoEmitidoSchema);

module.exports = VotoEmitido; 