const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Cargar variables de entorno
dotenv.config();

// Modelos
const Usuario = require('../models/Usuario');
const Vivienda = require('../models/Vivienda');
const Votacion = require('../models/Votacion');
const VotoEmitido = require('../models/VotoEmitido');
const Comunidad = require('../models/Comunidad');

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI);

// Mapa para almacenar referencias a comunidades
const comunidadesCache = new Map();

// Función para leer el archivo CSV
const importarDatosDesdeCSV = async (filePath) => {
  try {
    const data = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    
    const registros = parse(data, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';',
      trim: true
    });
    
    return registros;
  } catch (error) {
    console.error(`Error al leer el archivo CSV: ${error.message}`);
    process.exit(1);
  }
};

// Función para crear o obtener una comunidad
const obtenerComunidad = async (codigoComunidad) => {
  // Si no hay código, devolver null
  if (!codigoComunidad) return null;
  
  // Si ya tenemos la comunidad en caché, devolverla
  if (comunidadesCache.has(codigoComunidad)) {
    return comunidadesCache.get(codigoComunidad);
  }
  
  // Buscar o crear la comunidad
  let comunidad = await Comunidad.findOne({ codigo: codigoComunidad });
  
  if (!comunidad) {
    // Crear una nueva comunidad con el código proporcionado
    comunidad = await Comunidad.create({
      nombre: `Comunidad ${codigoComunidad}`,
      direccion: 'Dirección no especificada',
      cif: `CIF-${codigoComunidad}`,
      codigo: codigoComunidad
    });
    console.log(`Creada nueva comunidad con código: ${codigoComunidad}`);
  } else {
    console.log(`Encontrada comunidad existente con código: ${codigoComunidad}`);
  }
  
  // Guardar en caché para futuras referencias
  comunidadesCache.set(codigoComunidad, comunidad);
  
  return comunidad;
};

// Función para importar datos
const importarDatos = async () => {
  try {
    // Verificar si hay un archivo CSV de datos iniciales
    const csvFilePath = '../data/datos_iniciales.csv';
    let registros;
    
    try {
      registros = await importarDatosDesdeCSV(csvFilePath);
      console.log(`Se encontraron ${registros.length} registros en el CSV.`);
    } catch (error) {
      console.log('Archivo CSV no encontrado. Se requiere un archivo CSV para la carga de datos.');
      console.log('Ubicación esperada: /backend/data/datos_iniciales.csv');
      process.exit(1);
    }
    
    // Importar viviendas y usuarios
    for (const registro of registros) {
      try {
        // Obtener o crear la comunidad
        const comunidad = await obtenerComunidad(registro.comunidad);
        
        // Verificar si hay datos de vivienda
        if (registro.vivienda) {
          // Crear vivienda
          const vivienda = await Vivienda.create({
            numeroPuerta: registro.vivienda,
            coeficiente: parseFloat(registro.coeficiente ? registro.coeficiente.replace(',', '.') : 0),
            derechoVoto: registro.derechoVoto ? registro.derechoVoto.toUpperCase() === 'VERDADERO' : true,
            comunidad: comunidad ? comunidad._id : undefined
          });
          
          // Crear usuario
          const salt = await bcrypt.genSalt(10);
          const password = await bcrypt.hash('password123', salt);
          
          const usuario = await Usuario.create({
            nombre: registro.nombre,
            email: registro.email,
            password: password,
            rol: registro.rol || 'vecino',
            vivienda: vivienda._id,
            comunidad: comunidad ? comunidad._id : undefined
          });
          
          // Actualizar habitantes de la vivienda
          vivienda.habitantes.push(usuario._id);
          await vivienda.save();
          
          // Si el usuario es admin, añadirlo a los administradores de la comunidad
          if ((registro.rol === 'admin' || registro.rol === 'administrador') && comunidad) {
            if (!comunidad.administradores.includes(usuario._id)) {
              comunidad.administradores.push(usuario._id);
              await comunidad.save();
              console.log(`Usuario ${usuario.nombre} añadido como administrador de la comunidad ${comunidad.codigo}`);
            }
          }
          
          console.log(`Importado: ${registro.nombre} - ${registro.vivienda} ${comunidad ? '- Comunidad: ' + comunidad.codigo : ''}`);
        } else {
          // Usuario sin vivienda (superadmin)
          const salt = await bcrypt.genSalt(10);
          const password = await bcrypt.hash('password123', salt);
          
          const usuario = await Usuario.create({
            nombre: registro.nombre,
            email: registro.email,
            password: password,
            rol: registro.rol || 'vecino',
            comunidad: comunidad ? comunidad._id : undefined
          });
          
          console.log(`Importado usuario sin vivienda: ${registro.nombre} - Rol: ${registro.rol}`);
        }
      } catch (error) {
        console.error(`Error al importar registro ${registro.nombre}: ${error.message}`);
      }
    }
    
    // Crear usuario administrador por defecto si no existe
    const adminExists = await Usuario.findOne({ email: 'admin@votacom.com' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('admin123', salt);
      
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@votacom.com',
        password: password,
        rol: 'admin'
      });
      
      console.log('Usuario administrador creado.');
    }
    
    // Obtener todas las comunidades para crear una votación de ejemplo en cada una
    const comunidades = await Comunidad.find();
    
    for (const comunidad of comunidades) {
      try {
        // Buscar un administrador de esta comunidad
        const admin = await Usuario.findOne({ 
          comunidad: comunidad._id, 
          rol: { $in: ['admin', 'administrador'] } 
        });
        
        if (admin) {
          // Verificar si ya existe una votación para esta comunidad
          const votacionExiste = await Votacion.findOne({ 
            titulo: 'Cambio de ascensor',
            comunidad: comunidad._id
          });
          
          if (!votacionExiste) {
            await Votacion.create({
              titulo: 'Cambio de ascensor',
              descripcion: 'Votación para decidir si se cambia el ascensor de la comunidad',
              opciones: [
                { texto: 'A favor' },
                { texto: 'En contra' },
                { texto: 'Abstención' }
              ],
              fechaInicio: new Date(),
              fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días en el futuro
              tipoMayoria: 'simple',
              sistemaRecuento: 'vivienda',
              estado: 'activa',
              creador: admin._id,
              comunidad: comunidad._id
            });
            
            console.log(`Votación de ejemplo creada para la comunidad ${comunidad.codigo}.`);
          }
        }
      } catch (error) {
        console.error(`Error al crear votación para comunidad ${comunidad.codigo}: ${error.message}`);
      }
    }
    
    console.log('Datos importados correctamente');
    process.exit();
  } catch (error) {
    console.error(`Error al importar datos: ${error.message}`);
    process.exit(1);
  }
};

// Función para eliminar todos los datos
const eliminarDatos = async () => {
  try {
    console.log('Eliminando datos...');
    await Votacion.deleteMany();
    await VotoEmitido.deleteMany();
    await Usuario.deleteMany();
    await Vivienda.deleteMany();
    await Comunidad.deleteMany();
    
    console.log('Datos eliminados correctamente');
    process.exit();
  } catch (error) {
    console.error(`Error al eliminar datos: ${error.message}`);
    process.exit(1);
  }
};

// Determinar acción según el argumento de línea de comandos
if (process.argv[2] === '-d') {
  eliminarDatos();
} else {
  importarDatos();
} 