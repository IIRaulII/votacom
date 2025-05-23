import React from 'react';
import './VotacionAdminControls.css';

const VotacionAdminControls = ({ 
  user, 
  votacion, 
  estado, 
  iniciandoVotacion, 
  handleIniciarVotacion,
  mostrarInforme,
  setMostrarInforme
}) => {
  // Nota de administrador para iniciar votación manualmente
  const renderNotaAdmin = () => {
    if (estado === 'activa' && votacion.estado === 'pendiente') {
      return (
        <div className="votacion-nota-admin">
          <p><strong>Nota:</strong> Esta votación está programada para estar activa ahora según las fechas, pero aún figura como "pendiente" en el sistema. Un administrador debe iniciarla manualmente para permitir el voto.</p>
          {user && (user.rol === 'admin' || user.rol === 'superadmin') && (
            <button 
              className="btn btn-warning mt-2" 
              onClick={handleIniciarVotacion}
              disabled={iniciandoVotacion}
            >
              {iniciandoVotacion ? 'Iniciando...' : 'Iniciar votación ahora'}
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  // Sección de informe de participación (solo para administradores)
  const renderInformeSection = () => {
    if (user && (user.rol === 'admin' || user.rol === 'superadmin') && estado === 'finalizada') {
      return (
        <div className="votacion-informe-section">
          <div className="informe-header">
            <h2>Informe de Participación</h2>
            <p>Esta información solo es visible para administradores</p>
            
            <button 
              className="btn btn-primary"
              onClick={() => setMostrarInforme(!mostrarInforme)}
            >
              {mostrarInforme ? 'Ocultar informe' : 'Ver informe detallado'}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {renderNotaAdmin()}
      {renderInformeSection()}
    </>
  );
};

export default VotacionAdminControls; 