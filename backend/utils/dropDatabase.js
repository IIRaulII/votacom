const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const dropDatabase = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Eliminando la base de datos...');
    // Esto elimina toda la base de datos
    await mongoose.connection.dropDatabase();
    
    console.log('✅ Base de datos eliminada completamente');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error al eliminar la base de datos: ${error.message}`);
    process.exit(1);
  }
};

// Ejecutar la función
dropDatabase(); 