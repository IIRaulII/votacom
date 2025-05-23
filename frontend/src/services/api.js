import axios from 'axios';
import config from '../utils/config';

// Crear instancia de axios con la URL base
const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de solicitudes para agregar el token JWT
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.TOKEN_KEY);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      // No redirigir automáticamente si estamos en la página de login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem(config.TOKEN_KEY);
        window.location.href = config.ROUTES.LOGIN;
      }
    }
    
    // Construir un mensaje de error más descriptivo
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'Error de conexión con el servidor';
    
    return Promise.reject(errorMessage);
  }
);

// Exportar métodos de la API
export const authService = {
  login: async (credentials) => {
    const response = await api.post(config.ENDPOINTS.LOGIN, credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post(config.ENDPOINTS.REGISTER, userData);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.get(config.ENDPOINTS.LOGOUT);
    localStorage.removeItem(config.TOKEN_KEY);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get(config.ENDPOINTS.PROFILE);
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put(config.ENDPOINTS.UPDATE_PROFILE, userData);
    return response.data;
  },
};

export const usuarioService = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir los parámetros a la URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${config.ENDPOINTS.USERS}${query}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(config.ENDPOINTS.USER(id));
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post(config.ENDPOINTS.USERS, userData);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(config.ENDPOINTS.USER(id), userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(config.ENDPOINTS.USER(id));
    return response.data;
  },
};

export const viviendaService = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir los parámetros a la URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${config.ENDPOINTS.VIVIENDAS}${query}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(config.ENDPOINTS.VIVIENDA(id));
    return response.data;
  },
  
  create: async (viviendaData) => {
    const response = await api.post(config.ENDPOINTS.VIVIENDAS, viviendaData);
    return response.data;
  },
  
  update: async (id, viviendaData) => {
    const response = await api.put(config.ENDPOINTS.VIVIENDA(id), viviendaData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(config.ENDPOINTS.VIVIENDA(id));
    return response.data;
  },
};

export const votacionService = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir los parámetros a la URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${config.ENDPOINTS.VOTACIONES}${query}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(config.ENDPOINTS.VOTACION(id));
    return response.data;
  },
  
  create: async (votacionData) => {
    const response = await api.post(config.ENDPOINTS.VOTACIONES, votacionData);
    return response.data;
  },
  
  update: async (id, votacionData) => {
    const response = await api.put(config.ENDPOINTS.VOTACION(id), votacionData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(config.ENDPOINTS.VOTACION(id));
    return response.data;
  },
  
  emitirVoto: async (id, votoData) => {
    const response = await api.post(config.ENDPOINTS.EMITIR_VOTO(id), votoData);
    return response.data;
  },
  
  getResultados: async (id) => {
    try {
      const response = await api.get(config.ENDPOINTS.RESULTADOS(id));
      
      // Verificar si la respuesta contiene los datos esperados
      if (response.data) {
        // Si la respuesta ya tiene la estructura esperada, devolverla directamente
        if (response.data.success && response.data.data) {
          return response.data;
        }
        
        // Si la respuesta tiene éxito pero no tiene data, crear estructura compatible
        if (response.data.success) {
          return {
            success: true,
            data: response.data
          };
        }
        
        // En otro caso, intentar formar una respuesta compatible con lo que hay
        return {
          success: true,
          data: {
            // Si hay algunos campos comunes, intentar extraerlos
            resultados: response.data.resultados || response.data.opciones || [],
            totalVotos: response.data.totalVotos || 0,
            sistemaRecuento: response.data.sistemaRecuento || 'simple',
            participacion: response.data.participacion || 0
          }
        };
      } else {
        return { 
          success: false, 
          message: 'La respuesta del servidor no contiene datos'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: typeof error === 'string' ? error : 'Error al cargar los resultados de la votación'
      };
    }
  },
  
  iniciarVotacion: async (id) => {
    const response = await api.put(config.ENDPOINTS.INICIAR_VOTACION(id));
    return response.data;
  },
  
  getInformeParticipacion: async (id) => {
    try {
      const response = await api.get(config.ENDPOINTS.INFORME_PARTICIPACION(id));
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: typeof error === 'string' ? error : 'Error al cargar el informe de participación'
      };
    }
  },
  
  verificarVoto: async (id) => {
    try {
      const response = await api.get(config.ENDPOINTS.VERIFICAR_VOTO(id));
      return response.data;
    } catch (error) {
      return {
        success: false,
        yaVoto: false,
        message: typeof error === 'string' ? error : 'Error al verificar si el usuario ha votado'
      };
    }
  }
};

export const comunidadService = {
  getAll: async () => {
    const response = await api.get(config.ENDPOINTS.COMUNIDADES);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(config.ENDPOINTS.COMUNIDAD(id));
    return response.data;
  },
  
  create: async (comunidadData) => {
    const response = await api.post(config.ENDPOINTS.COMUNIDADES, comunidadData);
    return response.data;
  },
  
  update: async (id, comunidadData) => {
    const response = await api.put(config.ENDPOINTS.COMUNIDAD(id), comunidadData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(config.ENDPOINTS.COMUNIDAD(id));
    return response.data;
  },
  
  unirse: async (codigoComunidad) => {
    const response = await api.post(config.ENDPOINTS.UNIRSE_COMUNIDAD, { codigo: codigoComunidad });
    return response.data;
  }
};

export const actaService = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Añadir los parámetros a la URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${config.ENDPOINTS.ACTAS}${query}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(config.ENDPOINTS.ACTA(id));
    return response.data;
  },
  
  create: async (formData) => {
    const response = await api.post(config.ENDPOINTS.ACTAS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(config.ENDPOINTS.ACTA(id));
    return response.data;
  }
};

export default api; 