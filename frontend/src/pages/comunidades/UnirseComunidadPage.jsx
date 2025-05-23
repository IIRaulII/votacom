import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import './Comunidades.css';

const UnirseComunidadPage = () => {
  const { user, refreshUserData } = useAuthContext();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [joined, setJoined] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    // Si el usuario ya pertenece a una comunidad, redirigir al dashboard
    if (user && user.comunidad && !joined) {
      navigate('/dashboard');
    }
  }, [user, navigate, joined]);

  // Contador para redirección automática
  useEffect(() => {
    let timer;
    if (redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && joined) {
      // Cuando el contador llega a cero, redirigir
      navigate('/dashboard', { replace: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [redirectCountdown, joined, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Por favor, introduce un código de comunidad');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await comunidadService.unirse(codigo);
      
      if (response.success) {
        // Actualizar información de usuario desde el servidor
        const updatedUser = await refreshUserData();
        
        if (updatedUser && updatedUser.comunidad) {
          setSuccess(`Te has unido correctamente a la comunidad: ${response.data.comunidad.nombre}`);
          setJoined(true);
          // Iniciar cuenta regresiva para redirección (3 segundos)
          setRedirectCountdown(3);
        } else {
          setError('Error al actualizar los datos de usuario. Por favor, intenta iniciar sesión de nuevo.');
        }
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al unirse a la comunidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="comunidades-page">
      <div className="comunidades-header">
        <h1>Unirse a una comunidad</h1>
        <p>Introduce el código que te ha proporcionado el administrador de tu comunidad</p>
      </div>
      
      {error && (
        <div className="comunidades-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="comunidades-success">
          <p>{success}</p>
          {redirectCountdown > 0 ? (
            <p>Redirigiendo al dashboard en {redirectCountdown} segundos...</p>
          ) : (
            <p>
              <button 
                className="btn btn-primary" 
                onClick={handleGoToDashboard}
              >
                Ir al Dashboard
              </button>
            </p>
          )}
        </div>
      )}
      
      <div className="unirse-form-container">
        {!joined ? (
          <form onSubmit={handleSubmit} className="unirse-form">
            <div className="form-group">
              <label htmlFor="codigo">Código de comunidad:</label>
              <input
                type="text"
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Introduce el código aquí"
                required
              />
              <small className="form-text">Este código es privado y solo debe ser proporcionado por el administrador de tu comunidad.</small>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/seleccionar-comunidad')}
                disabled={loading}
              >
                Volver
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Uniéndose...' : 'Unirse a la comunidad'}
              </button>
            </div>
          </form>
        ) : (
          <div className="success-actions">
            <p>Tu perfil se ha actualizado correctamente.</p>
            <button 
              className="btn btn-primary"
              onClick={handleGoToDashboard}
            >
              Acceder a tu comunidad
            </button>
          </div>
        )}
      </div>
      
      <div className="comunidades-footer">
        <p>Si no tienes un código, contacta con el administrador de tu comunidad.</p>
      </div>
    </div>
  );
};

export default UnirseComunidadPage; 