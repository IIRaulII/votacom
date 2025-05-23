const mongoose = require('mongoose');

const actaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título del acta es obligatorio'],
    trim: true,
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha de la reunión es obligatoria'],
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

const Acta = mongoose.model('Acta', actaSchema);

module.exports = Acta; 