import { Link } from 'react-router-dom';
import config from '../../utils/config';
import './VotacionesList.css';

const VotacionesList = ({ 
  votaciones, 
  emptyMessage = 'No hay votaciones disponibles.',
  showStatus = true,
  showActions = true
}) => {
  if (!votaciones || votaciones.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }
  
  const getStatusClass = (votacion) => {
    const now = new Date();
    const fechaInicio = new Date(votacion.fechaInicio);
    const fechaFin = new Date(votacion.fechaFin);
    
    if (fechaInicio > now) {
      return 'status-pendiente';
    } else if (fechaFin < now) {
      return 'status-finalizada';
    } else {
      return 'status-activa';
    }
  };
  
  const getStatusText = (votacion) => {
    const now = new Date();
    const fechaInicio = new Date(votacion.fechaInicio);
    const fechaFin = new Date(votacion.fechaFin);
    
    if (fechaInicio > now) {
      return 'Pendiente';
    } else if (fechaFin < now) {
      return 'Finalizada';
    } else {
      return 'Activa';
    }
  };
  
  const getSistemaText = (sistemaRecuento) => {
    switch (sistemaRecuento) {
      case 'vivienda':
        return 'Por vivienda';
      case 'coeficiente':
        return 'Por coeficiente';
      case 'simple':
        return 'Simple';
      default:
        return sistemaRecuento || 'No especificado';
    }
  };

  // Función para determinar el resultado de una votación finalizada
  const getResultadoVotacion = (votacion) => {
    // Si la votación no está finalizada o no tiene resultados, no mostramos nada
    if (getStatusClass(votacion) !== 'status-finalizada' || !votacion.resultados) {
      return null;
    }

    // Si tiene resultados pero no hay votos, mostrar "Postergada"
    if (votacion.resultados.totalVotos === 0 || 
        (Array.isArray(votacion.resultados.resultados) && 
         votacion.resultados.resultados.every(r => !r.votos && !r.coeficiente))) {
      return {
        texto: 'Postergada',
        clase: 'resultado-postergada',
        icono: '🔄'
      };
    }

    // Buscar opciones a favor y en contra
    let opcionAFavor = null;
    let opcionEnContra = null;
    let opcionAbstencion = null;

    if (Array.isArray(votacion.resultados.resultados)) {
      votacion.resultados.resultados.forEach(opcion => {
        const texto = (opcion.opcion || opcion.texto || '').toLowerCase();
        if (texto.includes('favor') || texto === 'sí' || texto === 'si') {
          opcionAFavor = opcion;
        } else if (texto.includes('contra') || texto === 'no') {
          opcionEnContra = opcion;
        } else if (texto.includes('abstención') || texto.includes('abstencion')) {
          opcionAbstencion = opcion;
        }
      });
    }

    // Si solo hay abstenciones
    if (opcionAbstencion && !opcionAFavor && !opcionEnContra) {
      return {
        texto: 'Sin acuerdo',
        clase: 'resultado-sin-acuerdo',
        icono: '⚪'
      };
    }

    // Si hay empate
    if (opcionAFavor && opcionEnContra) {
      const votosAFavor = votacion.sistemaRecuento === 'coeficiente' ? opcionAFavor.coeficiente : opcionAFavor.votos;
      const votosEnContra = votacion.sistemaRecuento === 'coeficiente' ? opcionEnContra.coeficiente : opcionEnContra.votos;
      
      if (votosAFavor === votosEnContra) {
        return {
          texto: 'Empate',
          clase: 'resultado-empate',
          icono: '🟡'
        };
      }
    }

    // Verificar si se aprobó o rechazó
    if (opcionAFavor) {
      // Simplificación: si hay más votos a favor que en contra, se considera aprobada
      const votosAFavor = votacion.sistemaRecuento === 'coeficiente' ? opcionAFavor.coeficiente : opcionAFavor.votos;
      const votosEnContra = opcionEnContra ? 
        (votacion.sistemaRecuento === 'coeficiente' ? opcionEnContra.coeficiente : opcionEnContra.votos) : 0;
      
      if (votosAFavor > votosEnContra) {
        return {
          texto: 'Aprobada',
          clase: 'resultado-aprobada',
          icono: '✅'
        };
      } else {
        return {
          texto: 'Rechazada',
          clase: 'resultado-rechazada',
          icono: '❌'
        };
      }
    }

    // Si hay más votos en contra que a favor
    if (opcionEnContra && (!opcionAFavor || (opcionAFavor && opcionEnContra.votos > opcionAFavor.votos))) {
      return {
        texto: 'Rechazada',
        clase: 'resultado-rechazada',
        icono: '❌'
      };
    }

    // Si no podemos determinar el resultado pero está finalizada
    return {
      texto: 'Pendiente',
      clase: 'resultado-pendiente',
      icono: '⏳'
    };
  };
  
  return (
    <div className="votaciones-list">
      {votaciones.map(votacion => {
        const resultado = getResultadoVotacion(votacion);
        const isFinalizada = getStatusClass(votacion) === 'status-finalizada';
        
        return (
          <div key={votacion._id} className="votacion-item">
            {showStatus && (
              <div className={`votacion-status ${getStatusClass(votacion)}`}>
                {getStatusText(votacion)}
              </div>
            )}
            
            <h3 className="votacion-titulo">{votacion.titulo}</h3>
            <p className="votacion-descripcion">{votacion.descripcion}</p>
            
            <div className="votacion-fechas">
              <div className="fecha-grupo">
                <span className="fecha-label">Inicio:</span>
                <span className="fecha-valor">{new Date(votacion.fechaInicio).toLocaleDateString()}</span>
              </div>
              <div className="fecha-grupo">
                <span className="fecha-label">Fin:</span>
                <span className="fecha-valor">{new Date(votacion.fechaFin).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="votacion-meta">
              <div className="meta-item">
                <span className="meta-label">Sistema:</span>
                <span className="meta-valor">{getSistemaText(votacion.sistemaRecuento)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Opciones:</span>
                <span className="meta-valor">{votacion.opciones?.length || 0}</span>
              </div>
            </div>
            
            {/* Mostrar resultado si la votación está finalizada */}
            {isFinalizada && (
              <div className="votacion-resultado">
                {resultado ? (
                  <div className={`resultado-badge ${resultado.clase}`}>
                    <span className="resultado-icono">{resultado.icono}</span>
                    <span className="resultado-texto">{resultado.texto}</span>
                  </div>
                ) : (
                  <div className="resultado-badge resultado-pendiente">
                    <span className="resultado-icono">⏳</span>
                    <span className="resultado-texto">Pendiente</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Mostrar estado para votaciones activas y pendientes */}
            {!isFinalizada && (
              <div className="votacion-resultado">
                {getStatusClass(votacion) === 'status-activa' ? (
                  <div className="resultado-badge resultado-activa">
                    <span className="resultado-icono">⏱️</span>
                    <span className="resultado-texto">En curso</span>
                  </div>
                ) : (
                  <div className="resultado-badge resultado-pendiente">
                    <span className="resultado-icono">⏳</span>
                    <span className="resultado-texto">Pendiente</span>
                  </div>
                )}
              </div>
            )}
            
            {showActions && (
              <div className="votacion-actions">
                <Link 
                  to={config.ROUTES.VOTACION_DETALLE(votacion._id)} 
                  className="btn btn-primary"
                >
                  Ver detalles
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VotacionesList; 