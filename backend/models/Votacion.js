const mongoose = require('mongoose');

const votacionSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
  },
  opciones: [{
    texto: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  fechaInicio: {
    type: Date,
    default: Date.now,
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha límite es obligatoria'],
    validate: {
      validator: function(value) {
        return value > this.fechaInicio;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    },
  },
  tipoMayoria: {
    type: String,
    enum: ['simple', 'tres_quintos', 'unanimidad'],
    default: 'simple',
  },
  sistemaRecuento: {
    type: String,
    enum: ['vivienda', 'coeficiente'],
    default: 'vivienda',
  },
  estado: {
    type: String,
    enum: ['pendiente', 'activa', 'finalizada'],
    default: 'pendiente',
  },
  mostrarResultadosParciales: {
    type: Boolean,
    default: false,
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  comunidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comunidad',
    required: [true, 'La comunidad es obligatoria'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals para obtener los votos
votacionSchema.virtual('votos', {
  ref: 'VotoEmitido',
  localField: '_id',
  foreignField: 'votacion',
});

const Votacion = mongoose.model('Votacion', votacionSchema);

module.exports = Votacion; 