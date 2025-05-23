const mongoose = require('mongoose');

const viviendaSchema = new mongoose.Schema({
  numeroPuerta: {
    type: String,
    required: [true, 'El número de puerta es obligatorio'],
    trim: true,
  },
  coeficiente: {
    type: Number,
    required: [true, 'El coeficiente de participación es obligatorio'],
    min: [0, 'El coeficiente debe ser mayor que 0'],
  },
  derechoVoto: {
    type: Boolean,
    default: true,
  },
  habitantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
  }],
  comunidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comunidad',
    required: [true, 'La comunidad es obligatoria'],
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Índice compuesto para numeroPuerta y comunidad para asegurar unicidad dentro de cada comunidad
viviendaSchema.index({ numeroPuerta: 1, comunidad: 1 }, { unique: true });

// Método virtual para calcular cantidad de habitantes
viviendaSchema.virtual('cantidadHabitantes').get(function() {
  return this.habitantes ? this.habitantes.length : 0;
});

// Eliminar índices existentes y recrear solo el compuesto
const Vivienda = mongoose.model('Vivienda', viviendaSchema);

module.exports = Vivienda; 