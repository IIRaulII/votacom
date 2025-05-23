const mongoose = require('mongoose');

const comunidadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la comunidad es obligatorio'],
    trim: true,
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true,
  },
  cif: {
    type: String,
    required: [true, 'El CIF/NIF es obligatorio'],
    unique: true,
    trim: true,
  },
  codigo: {
    type: String,
    required: [true, 'El código de comunidad es obligatorio'],
    unique: true,
    trim: true,
  },
  administradores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals para obtener las viviendas de la comunidad
comunidadSchema.virtual('viviendas', {
  ref: 'Vivienda',
  localField: '_id',
  foreignField: 'comunidad',
});

// Virtuals para obtener los usuarios de la comunidad
comunidadSchema.virtual('usuarios', {
  ref: 'Usuario',
  localField: '_id',
  foreignField: 'comunidad',
});

// Virtuals para obtener las votaciones de la comunidad
comunidadSchema.virtual('votaciones', {
  ref: 'Votacion',
  localField: '_id',
  foreignField: 'comunidad',
});

const Comunidad = mongoose.model('Comunidad', comunidadSchema);

module.exports = Comunidad; 