import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './AuthForms.css';

const RegisterPage = () => {
  const { register: registerUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm();
  
  const password = watch('password');
  
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      await registerUser(data);
      navigate(config.ROUTES.DASHBOARD);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al registrarse. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Registrarse</h2>
          <p>Crea tu cuenta para participar en las votaciones de tu comunidad</p>
        </div>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              placeholder="Tu nombre"
              {...register('nombre', { 
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
            />
            {errors.nombre && <span className="form-error">{errors.nombre.message}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="tu.email@ejemplo.com"
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
            <label htmlFor="idVivienda">ID de Vivienda <span className="campo-opcional">(opcional)</span></label>
            <input
              type="text"
              id="idVivienda"
              placeholder="ID de tu vivienda (si lo conoces)"
              {...register('idVivienda')}
            />
            <small className="form-help-text">Si no conoces el ID de tu vivienda, déjalo en blanco. El administrador podrá asignarlo más tarde.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              autoComplete="new-password"
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
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              {...register('confirmPassword', { 
                required: 'Debes confirmar la contraseña',
                validate: value => value === password || 'Las contraseñas no coinciden'
              })}
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to={config.ROUTES.LOGIN}>Iniciar sesión</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 