const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const conectarDB = require('./config/db');
const errorMiddleware = require('./middlewares/errorMiddleware');
const config = require('./config/config');
const { iniciarTareasProgramadas } = require('./utils/cronJobs');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
conectarDB();

// Inicializar Express
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Configuración de CORS más flexible
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://votacom.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/viviendas', require('./routes/viviendaRoutes'));
app.use('/api/votaciones', require('./routes/votacionRoutes'));
app.use('/api/comunidades', require('./routes/comunidadRoutes'));
app.use('/api/actas', require('./routes/actaRoutes'));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API VotaCom - Sistema de votaciones para comunidades de vecinos'
  });
});

// Manejador de rutas no existentes
app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `No se encontró la ruta ${req.originalUrl} en este servidor`
  });
});

// Middleware de errores
app.use(errorMiddleware);

// Iniciar servidor
const PORT = config.PORT || 5000;
const server = app.listen(PORT, () => {
  // Silencio en modo producción
  if (config.NODE_ENV !== 'production') {
    console.log(`Servidor corriendo en modo ${config.NODE_ENV} en puerto ${PORT}`);
  }
  
  // Iniciar tareas programadas
  iniciarTareasProgramadas();
  if (config.NODE_ENV !== 'production') {
    console.log('Tareas programadas para finalización automática de votaciones iniciadas');
  }
});

// Manejar rechazos de promesas no capturadas
process.on('unhandledRejection', (err, promise) => {
  // Mantener el log de errores críticos incluso en producción
  console.log(`Error: ${err.message}`);
  // Cerrar servidor y salir del proceso
  server.close(() => process.exit(1));
}); 