import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import config from '../utils/config';
import useAuth from '../hooks/useAuth';

// Crear el contexto
export const AuthContext = createContext(null);

// Hook para usar el contexto
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 