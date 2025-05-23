import { useState, useEffect } from 'react';
import './ResultadosVotacion.css';

const ResultadosVotacion = ({ resultados }) => {
  const [opcionesOrdenadas, setOpcionesOrdenadas] = useState([]);
  const [totalVotos, setTotalVotos] = useState(0);
  const [mayorVotos, setMayorVotos] = useState(0);
  const [error, setError] = useState(null);
  const [resultadoVotacion, setResultadoVotacion] = useState({
    estado: '',
    mensaje: '',
    icono: ''
  });

  // Función para determinar el color de la barra según el tipo de opción
  const getBarColor = (opcionTexto) => {
    const texto = opcionTexto.toLowerCase();
    if (texto.includes('favor') || texto === 'sí' || texto === 'si') {
      return 'var(--color-success)'; // Verde para opciones a favor
    } else if (texto.includes('contra') || texto === 'no') {
      return 'var(--color-error)'; // Rojo para opciones en contra
    } else if (texto.includes('abstención') || texto.includes('abstencion')) {
      return 'var(--color-warning)'; // Amarillo para abstenciones
    }
    return 'var(--color-primary)'; // Color por defecto para otras opciones
  };

  // Función para determinar el resultado de la votación
  const determinarResultadoVotacion = (opciones, tipoMayoria, sistemaRecuento) => {
    if (!opciones || opciones.length === 0) {
      return {
        estado: 'no_determinado',
        mensaje: 'No hay datos suficientes para determinar el resultado',
        icono: '❓'
      };
    }

    // Calcular votos o coeficientes totales de los votos emitidos
    const totalVotosOCoeficientes = opciones.reduce((sum, opcion) => {
      return sum + (sistemaRecuento === 'coeficiente' ? (opcion.coeficiente || 0) : (opcion.votos || 0));
    }, 0);

    // Si no hay votos en total, la votación se considera postergada
    if (totalVotosOCoeficientes === 0) {
      return {
        estado: 'postergada',
        mensaje: 'Postergada / Aplazada',
        icono: '🔄'
      };
    }

    // Encontrar opciones a favor, en contra y abstenciones
    let opcionAFavor = null;
    let opcionEnContra = null;
    let opcionAbstencion = null;

    opciones.forEach(opcion => {
      const texto = (opcion.opcion || opcion.texto || '').toLowerCase();
      if (texto.includes('favor') || texto === 'sí' || texto === 'si') {
        opcionAFavor = opcion;
      } else if (texto.includes('contra') || texto === 'no') {
        opcionEnContra = opcion;
      } else if (texto.includes('abstención') || texto.includes('abstencion')) {
        opcionAbstencion = opcion;
      }
    });

    // Si solo hay abstenciones o no hay votos
    if ((opcionAbstencion && !opcionAFavor && !opcionEnContra)) {
      return {
        estado: 'sin_acuerdo',
        mensaje: 'No adoptada / Sin acuerdo',
        icono: '⚪'
      };
    }

    // Verificar empate entre a favor y en contra
    if (opcionAFavor && opcionEnContra) {
      const votosAFavor = sistemaRecuento === 'coeficiente' ? opcionAFavor.coeficiente : opcionAFavor.votos;
      const votosEnContra = sistemaRecuento === 'coeficiente' ? opcionEnContra.coeficiente : opcionEnContra.votos;
      
      if (votosAFavor === votosEnContra) {
        return {
          estado: 'empate',
          mensaje: 'Empate',
          icono: '🟡'
        };
      }
    }

    // Verificar si se alcanza la mayoría requerida
    if (opcionAFavor) {
      const votosAFavor = sistemaRecuento === 'coeficiente' ? opcionAFavor.coeficiente : opcionAFavor.votos;
      
      // Caso especial: Unanimidad
      if (tipoMayoria === 'unanimidad') {
        // Para unanimidad, verificamos que todos los votos emitidos sean a favor
        // Si hay algún voto en contra o abstención, no se cumple la unanimidad
        if (opcionEnContra && (sistemaRecuento === 'coeficiente' ? opcionEnContra.coeficiente > 0 : opcionEnContra.votos > 0)) {
          return {
            estado: 'rechazada',
            mensaje: 'Rechazada / Denegada',
            icono: '❌'
          };
        }
        
        if (opcionAbstencion && (sistemaRecuento === 'coeficiente' ? opcionAbstencion.coeficiente > 0 : opcionAbstencion.votos > 0)) {
          return {
            estado: 'rechazada',
            mensaje: 'Rechazada / Denegada',
            icono: '❌'
          };
        }
        
        // Si todos los votos emitidos son a favor, se considera aprobada por unanimidad
        return {
          estado: 'aprobada',
          mensaje: 'Aprobada / Aceptada por unanimidad',
          icono: '✅'
        };
      }
      
      // Para mayoría simple o tres quintos
      const votosEnContra = opcionEnContra ? (sistemaRecuento === 'coeficiente' ? opcionEnContra.coeficiente : opcionEnContra.votos) : 0;
      
      // Para mayoría simple, solo consideramos votos a favor y en contra (excluyendo abstenciones)
      if (tipoMayoria === 'simple') {
        // Si no hay votos en contra, y hay al menos un voto a favor, se aprueba
        if (votosEnContra === 0 && votosAFavor > 0) {
          return {
            estado: 'aprobada',
            mensaje: 'Aprobada / Aceptada',
            icono: '✅'
          };
        }
        
        // Calcular porcentaje solo considerando votos a favor y en contra
        const totalVotosValidos = votosAFavor + votosEnContra;
        
        // Si no hay votos válidos (solo abstenciones), no se puede determinar
        if (totalVotosValidos === 0) {
          return {
            estado: 'sin_acuerdo',
            mensaje: 'No adoptada / Sin acuerdo',
            icono: '⚪'
          };
        }
        
        const porcentajeAFavor = (votosAFavor / totalVotosValidos) * 100;
        
        if (porcentajeAFavor > 50) {
          return {
            estado: 'aprobada',
            mensaje: 'Aprobada / Aceptada',
            icono: '✅'
          };
        } else {
          return {
            estado: 'rechazada',
            mensaje: 'Rechazada / Denegada',
            icono: '❌'
          };
        }
      } else if (tipoMayoria === 'tres_quintos') {
        // Para tres quintos, calculamos sobre el total incluyendo abstenciones
        const porcentajeAFavor = (votosAFavor / totalVotosOCoeficientes) * 100;
        
        if (porcentajeAFavor > 60) { // 3/5 = 60%
          return {
            estado: 'aprobada',
            mensaje: 'Aprobada / Aceptada',
            icono: '✅'
          };
        } else {
          return {
            estado: 'rechazada',
            mensaje: 'Rechazada / Denegada',
            icono: '❌'
          };
        }
      }
    }

    // Si hay más votos en contra que a favor
    if (opcionEnContra && (!opcionAFavor || (opcionAFavor && opcionEnContra.votos > opcionAFavor.votos))) {
      return {
        estado: 'rechazada',
        mensaje: 'Rechazada / Denegada',
        icono: '❌'
      };
    }

    return {
      estado: 'no_determinado',
      mensaje: 'Resultado indeterminado',
      icono: '❓'
    };
  };

  useEffect(() => {
    try {
      if (resultados) {
        // Verificar si los resultados tienen la estructura esperada
        let datos = resultados;
        
        // Si los resultados tienen una propiedad "data", usar esa
        if (resultados.data && !resultados.resultados) {
          datos = resultados.data;
        }
        
        // Detectar si las opciones están en "opciones" o "resultados"
        let opciones = null;
        if (datos.resultados && Array.isArray(datos.resultados)) {
          opciones = datos.resultados;
        } else if (datos.opciones && Array.isArray(datos.opciones)) {
          opciones = datos.opciones;
        } else {
          setError('Los datos no contienen opciones en un formato reconocible');
          return;
        }
        
        // Ordenar opciones por cantidad de votos (descendente)
        const ordenadas = [...opciones].sort((a, b) => {
          if (datos.sistemaRecuento === 'coeficiente' && a.coeficiente && b.coeficiente) {
            return b.coeficiente - a.coeficiente;
          }
          return (b.votos || 0) - (a.votos || 0);
        });
        
        setOpcionesOrdenadas(ordenadas);
        
        // Calcular total de votos
        const total = datos.totalVotos || ordenadas.reduce((sum, opcion) => sum + (opcion.votos || 0), 0);
        setTotalVotos(total);
        
        // Obtener el mayor número de votos para calcular porcentajes
        const mayor = ordenadas.length > 0 ? 
          (datos.sistemaRecuento === 'coeficiente' ? 
            (ordenadas[0].coeficiente || 0) : 
            (ordenadas[0].votos || 0)) : 0;
        setMayorVotos(mayor);

        // Determinar el resultado de la votación
        const tipoMayoria = datos.tipoMayoria || 'simple';
        const sistemaRecuento = datos.sistemaRecuento || 'simple';
        const resultado = determinarResultadoVotacion(ordenadas, tipoMayoria, sistemaRecuento);
        setResultadoVotacion(resultado);
      }
    } catch (err) {
      setError(`Error al procesar los resultados: ${err.message}`);
    }
  }, [resultados]);

  if (error) {
    return (
      <div className="resultados-error">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!resultados || opcionesOrdenadas.length === 0) {
    return (
      <div className="resultados-no-disponibles">
        <p>No hay resultados disponibles para esta votación.</p>
      </div>
    );
  }

  // Detectar si estamos usando datos de la estructura nueva o antigua
  const datosResultados = resultados.data || resultados;
  const sistemaRecuento = datosResultados.sistemaRecuento || 'simple';

  return (
    <div className="resultados-votacion">
      {/* Mensaje de resultado de la votación */}
      <div className={`resultado-votacion-mensaje ${resultadoVotacion.estado}`}>
        <span className="resultado-icono">{resultadoVotacion.icono}</span>
        <span className="resultado-texto">{resultadoVotacion.mensaje}</span>
        {datosResultados.tipoMayoria && (
          <span className="resultado-detalle">
            Tipo de mayoría requerida: {
              datosResultados.tipoMayoria === 'simple' ? 'Simple (>50%)' :
              datosResultados.tipoMayoria === 'tres_quintos' ? 'Tres quintos (>60%)' :
              datosResultados.tipoMayoria === 'unanimidad' ? 'Unanimidad (100%)' : 
              datosResultados.tipoMayoria
            }
          </span>
        )}
      </div>

      <div className="resultados-resumen">
        <div className="resumen-item">
          <span className="resumen-valor">{totalVotos}</span>
          <span className="resumen-label">Votos totales</span>
        </div>
        <div className="resumen-item">
          <span className="resumen-valor">{datosResultados.participacion || 0}%</span>
          <span className="resumen-label">Participación</span>
        </div>
        {datosResultados.opcionGanadora && (
          <div className="resumen-item ganadora">
            <span className="resumen-valor">
              {datosResultados.opcionGanadora.texto || datosResultados.opcionGanadora.opcion || 'Ganadora'}
            </span>
            <span className="resumen-label">Opción ganadora</span>
          </div>
        )}
      </div>

      <div className="resultados-grafico-moderno">
        {opcionesOrdenadas.map((opcion, index) => {
          let porcentaje = 0;
          
          if (sistemaRecuento === 'coeficiente' && opcion.coeficiente) {
            const totalCoeficiente = opcionesOrdenadas.reduce((sum, o) => sum + (o.coeficiente || 0), 0);
            porcentaje = totalCoeficiente > 0 ? Math.round((opcion.coeficiente / totalCoeficiente) * 100) : 0;
          } else {
            porcentaje = totalVotos > 0 ? Math.round(((opcion.votos || 0) / totalVotos) * 100) : 0;
          }
          
          const esGanadora = datosResultados.opcionGanadora && 
            (datosResultados.opcionGanadora._id === (opcion._id || opcion.id));
          
          const opcionTexto = opcion.opcion || opcion.texto || `Opción ${index + 1}`;
          const barColor = getBarColor(opcionTexto);
          
          // Función para aclarar un color
          const getLighterColor = (color) => {
            // Si es una variable CSS, extraer el nombre
            if (color.startsWith('var(--')) {
              const colorName = color.match(/var\(--([^)]+)\)/)[1];
              
              // Mapear a versiones más claras
              if (colorName === 'color-success') return '#8cec65'; // Verde claro
              if (colorName === 'color-error') return '#ff8f8f';   // Rojo claro
              if (colorName === 'color-warning') return '#ffe066'; // Amarillo claro
              if (colorName === 'color-primary') return '#7fc1ff'; // Azul claro
              
              // Por defecto
              return '#8cec65';
            }
            
            return '#8cec65'; // Por defecto verde claro si no es una variable CSS
          };
          
          const borderColor = getLighterColor(barColor);
          
          return (
            <div key={opcion.id || opcion._id || index} className={`resultado-opcion-moderna ${esGanadora ? 'ganadora' : ''}`}>
              <div className="opcion-header">
                <span className="opcion-texto-moderna">{opcionTexto}</span>
              </div>
              
              <div className="opcion-barra-contenedor-moderna">
                <div 
                  className="opcion-barra-moderna" 
                  style={{ 
                    width: `${porcentaje}%`,
                    backgroundColor: barColor,
                    borderColor: borderColor
                  }}
                >
                  <span className="opcion-porcentaje">
                    {porcentaje}%
                  </span>
                </div>
              </div>
              
              <div className="opcion-datos-moderna">
                {sistemaRecuento === 'coeficiente' 
                  ? <span className="opcion-valor">{(opcion.coeficiente || 0).toFixed(2)} coeficiente</span>
                  : <span className="opcion-valor">{opcion.votos || 0} {(opcion.votos || 0) === 1 ? 'voto' : 'votos'}</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {datosResultados.metadatos && (
        <div className="resultados-metadatos">
          <h3>Información adicional</h3>
          {Object.entries(datosResultados.metadatos).map(([clave, valor], index) => (
            <div key={index} className="metadato-item">
              <span className="metadato-clave">{clave}:</span>
              <span className="metadato-valor">{valor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultadosVotacion; 