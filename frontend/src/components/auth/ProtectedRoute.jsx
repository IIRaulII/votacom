import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './ProtectedRoute.css';

const ProtectedRoute = ({ requireAdmin = false, requireSuperAdmin = false }) => {
  const { user, loading, isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Si está cargando, mostrar un mensaje de carga
  if (loading) {
    return <div className="loading-container">Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol de administrador si es requerido
  if (requireAdmin && user.rol !== 'admin' && user.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar rol de superadministrador si es requerido
  if (requireSuperAdmin && user.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar si el usuario debe unirse a una comunidad primero
  // No se requiere para rutas de selección de comunidad o superadmin
  const isCommunitySelectionRoute = location.pathname === '/seleccionar-comunidad' || 
                                   location.pathname === '/unirse-comunidad';
  
  // Un superadmin puede acceder a todas las rutas sin necesidad de comunidad
  const isSuperAdmin = user.rol === 'superadmin';
  
  // Permitir acceso a cualquier ruta administrativa para superadmin
  const isSuperAdminRoute = location.pathname.startsWith('/admin/');
  
  // Verificar si es una ruta de detalle de votación
  const isVotacionDetailRoute = location.pathname.match(/^\/votaciones\/[a-zA-Z0-9]+$/);
  
  // Solo redirigir a seleccionar comunidad si:
  // 1. El usuario no tiene comunidad asignada
  // 2. No es un superadmin o, si es superadmin, no está accediendo a rutas administrativas o de detalle de votación
  // 3. No está ya en una ruta de selección de comunidad
  if (!user.comunidad && 
      !isCommunitySelectionRoute && 
      !(isSuperAdmin && (isSuperAdminRoute || isVotacionDetailRoute))) {
    return <Navigate to="/seleccionar-comunidad" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 