const config = {
  // API URL base
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // Endpoints de la API
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/registro',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/actualizar-perfil',
    
    // Usuarios
    USERS: '/usuarios',
    USER: (id) => `/usuarios/${id}`,
    
    // Viviendas
    VIVIENDAS: '/viviendas',
    VIVIENDA: (id) => `/viviendas/${id}`,
    
    // Votaciones
    VOTACIONES: '/votaciones',
    VOTACION: (id) => `/votaciones/${id}`,
    EMITIR_VOTO: (id) => `/votaciones/${id}/votar`,
    RESULTADOS: (id) => `/votaciones/${id}/resultados`,
    INICIAR_VOTACION: (id) => `/votaciones/${id}/iniciar`,
    INFORME_PARTICIPACION: (id) => `/votaciones/${id}/informe-participacion`,
    VERIFICAR_VOTO: (id) => `/votaciones/${id}/verificar-voto`,
    
    // Comunidades
    COMUNIDADES: '/comunidades',
    COMUNIDAD: (id) => `/comunidades/${id}`,
    UNIRSE_COMUNIDAD: '/comunidades/unirse',
    
    // Actas
    ACTAS: '/actas',
    ACTA: (id) => `/actas/${id}`,
    
    // Facturas
    FACTURAS: '/facturas',
    FACTURA: (id) => `/facturas/${id}`,
  },
  
  // Tiempo de expiración del token en localStorage (milisegundos)
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas
  
  // Nombre de la clave para el token en localStorage
  TOKEN_KEY: 'votacom_token',
  
  // Nombres de las rutas en la aplicación
  ROUTES: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/registro',
    DASHBOARD: '/dashboard',
    PERFIL: '/perfil',
    VOTACIONES: '/votaciones',
    VOTACION_DETALLE: (id) => `/votaciones/${id}`,
    ADMIN: {
      USUARIOS: '/admin/usuarios',
      VIVIENDAS: '/admin/viviendas',
      VOTACIONES: '/admin/votaciones',
      NUEVA_VOTACION: '/admin/votaciones/nueva',
      EDITAR_VOTACION: (id) => `/admin/votaciones/${id}/editar`,
      COMUNIDADES: '/admin/comunidades',
      ACTAS: '/admin/actas',
      NUEVA_ACTA: '/admin/actas/nueva',
      FACTURAS: '/admin/facturas',
      NUEVA_FACTURA: '/admin/facturas/nueva',
    },
    SELECCIONAR_COMUNIDAD: '/seleccionar-comunidad',
    UNIRSE_COMUNIDAD: '/unirse-comunidad',
    ACTAS: '/actas',
    FACTURAS: '/facturas',
  }
};

export default config; 