/**
 * Script para resetear la contraseña del superadmin
 * Ejecutar con: node scripts/resetSuperAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const Usuario = require('../models/Usuario');

// Conectar a la base de datos
mongoose.connect(config.MONGO_URI).then(async () => {
  try {
    console.log('Conectado a MongoDB');
    
    // Buscar el usuario superadmin
    let superadmin = await Usuario.findOne({ email: 'super@comunidad.com' });
    
    if (!superadmin) {
      console.log('No se encontró el usuario superadmin, creando uno nuevo...');
      
      // Crear un nuevo superadmin si no existe - No hashear aquí, el modelo lo hará automáticamente
      superadmin = new Usuario({
        nombre: 'Super Administrador',
        email: 'super@comunidad.com',
        password: 'superadmin123',
        rol: 'superadmin'
      });
      
      await superadmin.save();
      console.log('Usuario superadmin creado con éxito');
    } else {
      console.log('Usuario superadmin encontrado, reseteando contraseña...');
      
      // Actualizar la contraseña usando findByIdAndUpdate para evitar el middleware pre-save
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      // Usar updateOne para evitar los middlewares de "save"
      await Usuario.updateOne(
        { _id: superadmin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Contraseña de superadmin actualizada correctamente');
      
      // Verificar que la contraseña funciona
      superadmin = await Usuario.findOne({ email: 'super@comunidad.com' }).select('+password');
      const passwordEsValida = await bcrypt.compare('superadmin123', superadmin.password);
      console.log('Verificación de contraseña: ' + (passwordEsValida ? 'Correcta' : 'Incorrecta'));
    }
    
    console.log('\nDatos de acceso para el superadmin:');
    console.log('Email: super@comunidad.com');
    console.log('Contraseña: superadmin123');
    
    // Desconectar de la base de datos
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Asegurar que la desconexión ocurra
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(0);
  }
}).catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
}); 