import React from 'react';
import './VotacionEstadoMessage.css';

const VotacionEstadoMessage = ({ tipo, votacion }) => {
  if (tipo === 'sin-vivienda') {
    return (
      <div className="votacion-sin-vivienda">
        <div className="sin-vivienda-message">
          <h3>No puedes votar en esta votación</h3>
          <p>No tienes ninguna vivienda asignada. Contacta con el administrador para que te asigne una vivienda.</p>
        </div>
      </div>
    );
  }

  if (tipo === 'ya-voto') {
    return (
      <div className="votacion-ya-voto">
        <div className="ya-voto-message">
          <h3>Ya has votado en esta votación</h3>
          <p>Tu voto ha sido registrado correctamente. Gracias por participar.</p>
          {votacion.mostrarResultadosParciales ? (
            <p>Los resultados parciales se muestran a continuación.</p>
          ) : (
            <p>Los resultados estarán disponibles cuando finalice la votación.</p>
          )}
        </div>
      </div>
    );
  }

  if (tipo === 'pendiente') {
    return (
      <div className="votacion-pendiente-message">
        <h3>Votación aún no iniciada</h3>
        <p>Esta votación comenzará el {new Date(votacion.fechaInicio).toLocaleString()}</p>
        <p>Vuelve en esa fecha para participar.</p>
      </div>
    );
  }

  return null;
};

export default VotacionEstadoMessage; 