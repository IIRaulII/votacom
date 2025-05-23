const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: '7d', // Tiempo de expiración del token
  JWT_COOKIE_EXPIRE: 7, // Días para expiración de cookie
}; 