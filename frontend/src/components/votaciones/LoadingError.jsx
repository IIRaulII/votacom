import React from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../utils/config';
import './LoadingError.css';

const LoadingError = ({ loading, error, notFound }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando votación...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="votacion-error-container">
        <div className="votacion-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate(config.ROUTES.VOTACIONES)}
          >
            Volver a votaciones
          </button>
        </div>
      </div>
    );
  }
  
  if (notFound) {
    return (
      <div className="votacion-error-container">
        <div className="votacion-error">
          <h2>Votación no encontrada</h2>
          <p>La votación que buscas no existe o ha sido eliminada.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate(config.ROUTES.VOTACIONES)}
          >
            Volver a votaciones
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default LoadingError; 