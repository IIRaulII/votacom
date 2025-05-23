import React from 'react';
import ResultadosVotacion from './ResultadosVotacion';
import './VotacionResultados.css';

const VotacionResultados = ({ estado, loadingResultados, resultados, votacion }) => {
  if (loadingResultados) {
    return (
      <div className="votacion-resultados-section">
        <h2>Resultados de la votación</h2>
        <div className="loading-container" style={{ minHeight: '200px' }}>
          <div className="loading-spinner"></div>
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (!resultados) {
    // Verificar si la votación tiene votos según la información disponible
    const tieneVotos = votacion.votos && votacion.votos.length > 0;
    
    // Solo mostrar "Postergada / Aplazada" si realmente no hay votos
    if (!tieneVotos) {
      return (
        <div className="votacion-resultados-section">
          <h2>Resultados de la votación</h2>
          <div className="votacion-sin-participacion-message">
            <div className="resultado-votacion-mensaje postergada">
              <span className="resultado-icono">🔄</span>
              <span className="resultado-texto">Postergada / Aplazada</span>
              <p className="resultado-detalle">La votación ha finalizado sin recibir ningún voto. Se considera que la decisión ha sido aplazada.</p>
            </div>
            
            <div className="info-adicional">
              <p>Información sobre la votación:</p>
              <ul>
                <li>Total de viviendas en la comunidad: {votacion.metadatos?.totalViviendas || 'No disponible'}</li>
                <li>Viviendas con derecho a voto: {votacion.metadatos?.viviendasConDerechoVoto || 'No disponible'}</li>
                <li>Participación: 0 votos (0%)</li>
              </ul>
            </div>
          </div>
        </div>
      );
    } else {
      // Si hay votos pero no tenemos resultados, mostrar un mensaje de carga
      return (
        <div className="votacion-resultados-section">
          <h2>Resultados de la votación</h2>
          <div className="loading-container" style={{ minHeight: '200px' }}>
            <div className="loading-spinner"></div>
            <p>Cargando resultados...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="votacion-resultados-section">
      <h2>
        {estado === 'finalizada' 
          ? 'Resultados finales de la votación' 
          : 'Resultados parciales (en tiempo real)'}
      </h2>
      
      {estado !== 'finalizada' && (
        <div className="votacion-nota" style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          borderLeft: '4px solid #ffc107',
          borderRadius: '4px' 
        }}>
          <p><strong>Nota:</strong> Estos son resultados parciales y pueden cambiar hasta que finalice la votación.</p>
        </div>
      )}
      
      <div style={{ background: '#f9f9f9', padding: '10px', marginBottom: '15px', fontSize: '14px' }}>
        <p><strong>Información sobre la votación:</strong></p>
        <p><strong>Sistema de recuento:</strong> {resultados?.sistemaRecuento === 'coeficiente' ? 
          'Por coeficiente de participación (el peso de cada voto depende del coeficiente de la vivienda)' : 
          'Por vivienda (cada vivienda cuenta como un voto independientemente de su coeficiente)'}</p>
        <p><strong>Tipo de mayoría requerida:</strong> {
          votacion.tipoMayoria === 'simple' ? 'Mayoría simple (más votos a favor que en contra, las abstenciones no se contabilizan)' :
          votacion.tipoMayoria === 'tres_quintos' ? 'Tres quintos (3/5) de los votos (equivalente al 60%)' :
          votacion.tipoMayoria === 'unanimidad' ? 'Unanimidad (100% de los votos)' : 'No especificado'
        }</p>
        <p><strong>Información sobre participación:</strong></p>
        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
          <li>Total de viviendas en la comunidad: {resultados?.totalViviendas || votacion.metadatos?.totalViviendas || 'No disponible'}</li>
          <li>Viviendas con derecho a voto: {resultados?.viviendasConDerechoVoto || votacion.metadatos?.viviendasConDerechoVoto || 'No disponible'}</li>
          <li>El porcentaje de participación (es solo informativo, no se utiliza para el recuento) se calcula sobre las {resultados?.viviendasConDerechoVoto || 'N/A'} viviendas con derecho a voto en esta votación.</li>
          {votacion.tipoMayoria === 'simple' && (
            <li><strong>Nota sobre abstenciones:</strong> En mayoría simple, las abstenciones no cuentan para calcular el resultado. Solo se consideran los votos a favor y en contra. Por tanto, si hay más votos a favor que en contra, la propuesta se aprueba, independientemente del número de abstenciones.</li>
          )}
        </ul>
      </div>
      <ResultadosVotacion resultados={{
        ...resultados,
        tipoMayoria: votacion.tipoMayoria
      }} />
    </div>
  );
};

export default VotacionResultados; 