import React from 'react';
import './VotacionInfo.css';

const VotacionInfo = ({ votacion, resultados, estado }) => {
  return (
    <div className="votacion-info-section">
      <div className="votacion-descripcion">
        <h2>Descripción</h2>
        <p>{votacion.descripcion}</p>
      </div>
      
      <div className="votacion-meta">
        <div className="votacion-fechas">
          <div className="fecha-item">
            <span className="fecha-label">Fecha de inicio:</span>
            <span className="fecha-valor">{new Date(votacion.fechaInicio).toLocaleString()}</span>
          </div>
          <div className="fecha-item">
            <span className="fecha-label">Fecha de fin:</span>
            <span className="fecha-valor">{new Date(votacion.fechaFin).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="votacion-datos">
          <div className="dato-item">
            <span className="dato-label">Sistema de votación:</span>
            <span className="dato-valor">
              {votacion.sistemaRecuento === 'vivienda' 
                ? 'Por vivienda' 
                : votacion.sistemaRecuento === 'coeficiente' 
                  ? 'Por coeficiente' 
                  : votacion.sistemaRecuento || 'No especificado'}
            </span>
          </div>
          <div className="dato-item">
            <span className="dato-label">Total de opciones:</span>
            <span className="dato-valor">{votacion.opciones?.length || 0}</span>
          </div>
          {estado !== 'pendiente' && (
            <div className="dato-item">
              <span className="dato-label">Participación:</span>
              <span className="dato-valor">
                {resultados ? 
                  `${resultados.totalVotos || 0} ${resultados.totalVotos === 1 ? 'voto' : 'votos'}`
                  : 
                  `${votacion.votos?.length || 0} ${votacion.votos?.length === 1 ? 'voto' : 'votos'}`
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotacionInfo; 