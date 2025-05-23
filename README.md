# VotaCom 📋


## Sistema de Gestión y Votaciones para Comunidades de Vecinos

VotaCom es una aplicación web diseñada para modernizar la gestión de comunidades de vecinos, simplificando el proceso de votaciones y facilitando la comunicación entre propietarios y administradores.

## 🌟 Características

- **Gestión de comunidades**: Creación y administración de comunidades de vecinos.
- **Sistema de votaciones**: Creación, participación y seguimiento de votaciones electrónicas.
- **Gestión de actas**: Generación y consulta de actas de reuniones.
- **Control de usuarios y viviendas**: Administración de propietarios y viviendas.
- **Panel de administración**: Herramientas completas para administradores y presidentes de comunidades.
- **Autenticación segura**: Sistema de registro y login con protección de rutas.
- **Interfaz responsive**: Diseño adaptable a todos los dispositivos.

## 🚀 Tecnologías

### Backend
- **Node.js** con **Express.js** como framework web
- **MongoDB** como base de datos NoSQL (con Mongoose)
- **JWT** para autenticación segura
- **Multer** para gestión de archivos
- **Node-cron** para tareas programadas

### Frontend
- **React 19** con **Vite** como bundler
- **React Router DOM v7** para navegación
- **React Hook Form** para manejo de formularios
- **Axios** para peticiones HTTP
- **JWT-decode** para gestión de tokens

## 🔧 Instalación y Configuración

### Requisitos previos
- Node.js (v16 o superior)
- NPM (v7 o superior)
- MongoDB (local o atlas)

### Configuración del Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
   - Crea o modifica el archivo `.env` con las siguientes variables:
```
PORT=5000
MONGO_URI=tu_conexion_a_mongodb
JWT_SECRET=tu_clave_secreta
NODE_ENV=development
```

4. (Opcional) Inicializa la base de datos con datos de prueba:
```bash
# Poblar la base de datos con datos iniciales
npm run seed

# Si necesitas limpiar la base de datos
npm run drop-db
```

5. **Importante**: Configura el acceso como superadministrador:
```bash
# Tras ejecutar el seeder, configura el usuario superadmin con este script
node scripts/resetSuperAdmin.js
```
   Esta operación te dará acceso a la aplicación con las siguientes credenciales:
   - **Email**: super@comunidad.com
   - **Contraseña**: superadmin123

6. Ejecuta el servidor:
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### Configuración del Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
   - Crea o modifica el archivo `.env` con las siguientes variables:
```
VITE_API_URL=http://localhost:5000/api
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

5. Para producción, construye la aplicación:
```bash
npm run build
```

## 📊 Datos de Prueba

El sistema incluye un conjunto de datos iniciales para facilitar el desarrollo y las pruebas:

- **datos_iniciales.csv**: Archivo CSV con información de comunidades, viviendas y usuarios de prueba.



```bash
# Poblar la base de datos con los datos iniciales
npm run seed

# Eliminar todos los datos de la base de datos
npm run drop-db
```

El seeder (`utils/seeder.js`) crea automáticamente:
- Comunidades de vecinos de ejemplo
- Propietarios y administradores
- Viviendas con diferentes coeficientes
- Votaciones de prueba


Esto te permite probar todas las funcionalidades sin necesidad de crear datos manualmente.

## 🏗️ Estructura del Proyecto

### Backend
```
backend/
├── config/          # Configuración de la aplicación
├── controllers/     # Lógica de negocio 
├── data/            # Datos de inicialización
├── middlewares/     # Middlewares personalizados
├── models/          # Modelos de datos (Mongoose)
├── routes/          # Definición de rutas API
├── scripts/         # Scripts de utilidad
├── uploads/         # Archivos subidos
├── utils/           # Utilidades y funciones auxiliares
└── server.js        # Punto de entrada
```

### Frontend
```
frontend/
├── public/          # Archivos estáticos
├── src/
│   ├── components/  # Componentes reutilizables
│   ├── context/     # Contextos de React
│   ├── hooks/       # Custom hooks
│   ├── pages/       # Páginas de la aplicación
│   ├── services/    # Servicios y API
│   ├── styles/      # Estilos CSS
│   ├── utils/       # Utilidades
│   ├── App.jsx      # Componente principal
│   └── main.jsx     # Punto de entrada
└── index.html       # Plantilla HTML
```

## 👥 Roles de Usuario

- **Superadministrador**: Gestión completa del sistema y comunidades
- **Administrador**: Gestión de una comunidad específica
- **Propietario**: Participación en votaciones y consulta de actas
- **Usuario no registrado**: Acceso únicamente a la página de inicio, registro y login

## 📝 Licencia

Este proyecto está bajo licencia [MIT]

## 🤝 Contacto

Para soporte, contactar al desarrollador en raulmontoyareina@gmail.com.

---

© 2025 VotaCom. Todos los derechos reservados. 