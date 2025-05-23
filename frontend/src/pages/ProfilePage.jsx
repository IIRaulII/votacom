import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { usuarioService } from '../services/api';
import config from '../utils/config';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUserData, logout, refreshUserData } = useAuthContext();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  useEffect(() => {
    if (user) {
      setUserData({
        nombre: user.nombre || '',
        email: user.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (userData.password && userData.password !== userData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud mínima de contraseña
    if (userData.password && userData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Preparar datos para la actualización
    const updateData = {
      nombre: userData.nombre,
    };
    
    // Solo incluir la contraseña si se ha modificado
    if (userData.password) {
      updateData.password = userData.password;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const updatedUser = await updateUserData(updateData);
      
      if (updatedUser) {
        setMessage('Perfil actualizado correctamente');
        
        // Limpiar los campos de contraseña
        setUserData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        
        setEditMode(false);
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError('Error al actualizar el perfil');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate(config.ROUTES.HOME);
    } catch (err) {
      // Error silencioso
    }
  };
  
  const handleRefreshUserData = async () => {
    try {
      setRefreshLoading(true);
      setError(null);
      setMessage('Actualizando datos del usuario desde el servidor...');
      
      const updatedUser = await refreshUserData();
      
      if (updatedUser) {
        setMessage('Perfil actualizado correctamente desde el servidor');
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => setMessage(null), 3000);
      } else {
        setError('No se pudo actualizar la información del usuario');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al actualizar los datos del usuario');
    } finally {
      setRefreshLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Tu perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>
      
      {message && (
        <div className="profile-message success">
          {message}
        </div>
      )}
      
      {error && (
        <div className="profile-message error">
          {error}
        </div>
      )}
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            
            <div className="profile-details">
              <h2>{user.nombre}</h2>
              <p className="profile-email">{user.email}</p>
              <p className="profile-role">
                {user.rol === 'superadmin' 
                  ? 'Super Administrador' 
                  : user.rol === 'admin' 
                    ? 'Administrador' 
                    : 'Vecino'}
              </p>
              
              {user.comunidad && (
                <p className="profile-community">
                  <strong>Comunidad:</strong> {user.comunidad.nombre || 'No especificada'}
                </p>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            {!editMode ? (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditMode(true)}
                >
                  <i className="icon">✏️</i> Editar perfil
                </button>
                
                <button 
                  className="btn btn-secondary"
                  onClick={handleRefreshUserData}
                  disabled={refreshLoading}
                >
                  <i className="icon">{refreshLoading ? '⏳' : '🔄'}</i> 
                  {refreshLoading ? 'Actualizando...' : 'Actualizar datos'}
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={userData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    disabled
                  />
                  <small>No puedes cambiar tu email</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Nueva contraseña</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    placeholder="Dejar en blanco para mantener la actual"
                  />
                  <small>La contraseña debe tener al menos 6 caracteres</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirma tu nueva contraseña"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setError(null);
                      // Restaurar los datos originales
                      setUserData({
                        nombre: user.nombre || '',
                        email: user.email || '',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <div className="profile-side-panel">
          {user.vivienda && (
            <div className="profile-section-card">
              <h3>Información de vivienda</h3>
              <div className="vivienda-info">
                <p><strong>Puerta:</strong> {user.vivienda.numeroPuerta || 'No especificada'}</p>
                <p><strong>Coeficiente:</strong> {user.vivienda.coeficiente ? `${user.vivienda.coeficiente}%` : 'No especificado'}</p>
                <p><strong>Derecho a voto:</strong> {user.vivienda.derechoVoto ? 'Sí' : 'No'}</p>
              </div>
            </div>
          )}
          
          <div className="profile-section-card">
            <h3>Acciones de cuenta</h3>
            <div className="account-actions">
              <button 
                className="btn btn-danger btn-block"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 