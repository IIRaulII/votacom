import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import './Comunidades.css';

const SeleccionarComunidadPage = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Si el usuario ya pertenece a una comunidad, redirigir al dashboard
    if (user && user.comunidad) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  return (
    <div className="comunidades-page">
      <div className="comunidades-header">
        <h1>Unirse a una comunidad</h1>
        <p>Para acceder a tu comunidad de vecinos necesitas un código de acceso</p>
      </div>
      
      {user && user.rol === 'superadmin' && (
        <div className="superadmin-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/admin/comunidades')}
          >
            Gestionar Comunidades
          </button>
        </div>
      )}
      
      <div className="empty-comunidades">
        <p>Para unirte a tu comunidad de vecinos, necesitas el código de acceso que te proporcionará el administrador de la comunidad.</p>
        <p>Este código es privado y único para cada comunidad.</p>
        
        <div className="empty-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/unirse-comunidad')}
          >
            Tengo un código de comunidad
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={logout}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      <div className="comunidades-footer">
        <p>¿No tienes un código? Ponte en contacto con el administrador de tu comunidad.</p>
      </div>
    </div>
  );
};

export default SeleccionarComunidadPage; 