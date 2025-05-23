import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import config from '../utils/config';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Función para verificar si el token es válido
  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Verificar si el token no ha expirado
      return decodedToken.exp > currentTime;
    } catch (error) {
      return false;
    }
  }, []);
  
  // Función para cargar la información del usuario
  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(config.TOKEN_KEY);
      
      if (token && isTokenValid(token)) {
        const userData = await authService.getProfile();
        setUser(userData.data);
        return userData.data;
      } else {
        // Si el token no es válido, limpiar
        localStorage.removeItem(config.TOKEN_KEY);
        setUser(null);
        return null;
      }
    } catch (err) {
      setError(err);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isTokenValid]);
  
  // Cargar usuario al iniciar
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  
  // Función para recargar la información del usuario desde el servidor
  const refreshUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem(config.TOKEN_KEY);
      if (!token || !isTokenValid(token)) {
        // Si no hay token o no es válido, limpiar y redirigir al login
        localStorage.removeItem(config.TOKEN_KEY);
        setUser(null);
        return null;
      }
      
      const userData = await authService.getProfile();
      
      if (userData && userData.success && userData.data) {
        // Actualizar el usuario en el estado con los nuevos datos
        setUser(userData.data);
        return userData.data;
      } else {
        return null;
      }
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Función para iniciar sesión
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      
      if (response && response.success && response.token) {
        localStorage.setItem(config.TOKEN_KEY, response.token);
        setUser(response.usuario);
        return response.usuario;
      } else {
        // Si la respuesta no tiene éxito pero no lanza error
        const errorMsg = (response && response.message) ? response.message : 'Error al iniciar sesión';
        throw new Error(errorMsg);
      }
    } catch (err) {
      setError(err);
      // Asegurar que el error se propaga correctamente
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Función para registrarse
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      
      if (response.success && response.token) {
        localStorage.setItem(config.TOKEN_KEY, response.token);
        setUser(response.usuario);
        return response.usuario;
      } else {
        throw new Error(response.message || 'Error al registrarse');
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cerrar sesión
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      localStorage.removeItem(config.TOKEN_KEY);
      setUser(null);
      navigate(config.ROUTES.HOME);
    } catch (err) {
      setError(err);
      // Incluso si hay error, eliminamos el token
      localStorage.removeItem(config.TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para actualizar datos del usuario en el estado
  const updateUserData = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(userData);
      
      if (response.success) {
        setUser(response.data);
        return response.data;
      }
      
      return null;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUserData,
    updateUserData,
    isAuthenticated: !!user,
  };
};

export default useAuth; 