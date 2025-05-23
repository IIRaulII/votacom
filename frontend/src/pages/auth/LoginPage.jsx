import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './AuthForms.css';

const LoginPage = () => {
  const { login, refreshUserData } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();
  
  // Limpiar cualquier error al cargar la página
  useEffect(() => {
    localStorage.removeItem('login_error');
    localStorage.removeItem('api_last_error');
  }, []);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    shouldFocusError: true
  });
  
  // Limpiar el error cuando el usuario empieza a escribir
  const handleInputChange = () => {
    if (loginError) {
      setLoginError(null);
    }
  };
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setLoginError(null);
      
      // Intentar inicio de sesión
      const result = await login(data);
      
      if (result) {
        // Cargar datos completos del usuario después del login
        await refreshUserData();
        
        // Navegamos al dashboard tras éxito
        navigate(config.ROUTES.DASHBOARD);
      } else {
        // No hay resultado pero tampoco error
        setLoginError('Error en el inicio de sesión. Inténtalo de nuevo.');
      }
    } catch (err) {
      // Crear mensaje de error fácil de entender
      const errorMessage = typeof err === 'string' 
        ? err 
        : err.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Iniciar sesión</h2>
          <p>Accede a tu cuenta para gestionar tus votaciones</p>
        </div>
        
        {loginError && (
          <div className="auth-error">
            {loginError}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" onChange={handleInputChange}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="tu.email@ejemplo.com"
              autoComplete="username"
              {...register('email', { 
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              {...register('password', { 
                required: 'La contraseña es obligatoria',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                }
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to={config.ROUTES.REGISTER}>Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 