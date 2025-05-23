import React from 'react';
import './VotacionHeader.css';

const VotacionHeader = ({ votacion, estado, tiempoRestante }) => {
  return (
    <div className="votacion-detail-header">
      <h1>{votacion.titulo}</h1>
      <div className={`votacion-estado ${estado}`}>
        {estado === 'activa' && (
          <>
            <span>Votación en curso</span>
            {tiempoRestante && (
              <div className={`tiempo-restante ${tiempoRestante.minutos < 1 && tiempoRestante.horas === 0 && tiempoRestante.dias === 0 ? 'tiempo-critico' : ''}`}>
                <span className="temporizador">
                  {tiempoRestante.dias > 0 && `${tiempoRestante.dias}d `}
                  {(tiempoRestante.horas > 0 || tiempoRestante.dias > 0) && `${tiempoRestante.horas}h `}
                  {tiempoRestante.minutos}m {tiempoRestante.segundos.toString().padStart(2, '0')}s
                </span>
                <span className="temporizador-label">tiempo restante para votar</span>
              </div>
            )}
          </>
        )}
        {estado === 'pendiente' && 'Votación pendiente'}
        {estado === 'finalizada' && 'Votación finalizada'}
      </div>
    </div>
  );
};

export default VotacionHeader; 