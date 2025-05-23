import { useState, useEffect } from 'react';
import { votacionService } from '../../services/api';
import './InformeParticipacion.css';

const InformeParticipacion = ({ votacionId }) => {
  const [informe, setInforme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const fetchInforme = async () => {
      try {
        setLoading(true);
        const response = await votacionService.getInformeParticipacion(votacionId);
        
        if (response.success) {
          setInforme(response.data);
        } else {
          setError(response.message || 'Error al cargar el informe de participación');
        }
      } catch (err) {
        setError('Error al cargar el informe de participación');
      } finally {
        setLoading(false);
      }
    };

    if (votacionId) {
      fetchInforme();
    }
  }, [votacionId]);

  const getEstadoVivienda = (vivienda) => {
    if (!vivienda.derechoVoto) {
      return { 
        texto: 'Sin derecho a voto', 
        clase: 'sin-derecho-voto',
        filtro: 'sin-derecho'
      };
    }
    
    if (!vivienda.voto) {
      return { 
        texto: 'No votó', 
        clase: 'no-voto',
        filtro: 'no-voto'
      };
    }
    
    const opcionTexto = vivienda.voto.opcionTexto.toLowerCase();
    if (opcionTexto.includes('favor') || opcionTexto === 'sí' || opcionTexto === 'si') {
      return { 
        texto: 'A favor', 
        clase: 'a-favor',
        filtro: 'a-favor'
      };
    } else if (opcionTexto.includes('contra') || opcionTexto === 'no') {
      return { 
        texto: 'En contra', 
        clase: 'en-contra',
        filtro: 'en-contra'
      };
    } else if (opcionTexto.includes('abstención') || opcionTexto.includes('abstencion')) {
      return { 
        texto: 'Abstención', 
        clase: 'abstencion',
        filtro: 'abstencion'
      };
    }
    
    return { 
      texto: 'Votó: ' + vivienda.voto.opcionTexto, 
      clase: 'otro-voto',
      filtro: 'otros'
    };
  };

  const filtrarViviendas = () => {
    if (!informe || !informe.viviendas || filtro === 'todos') {
      return informe?.viviendas || [];
    }
    
    return informe.viviendas.filter(vivienda => {
      const estado = getEstadoVivienda(vivienda);
      return estado.filtro === filtro;
    });
  };

  if (loading) {
    return (
      <div className="informe-loading">
        <div className="loading-spinner"></div>
        <p>Cargando informe de participación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="informe-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!informe) {
    return (
      <div className="informe-vacio">
        <p>No hay datos disponibles para generar el informe.</p>
      </div>
    );
  }

  const viviendasFiltradas = filtrarViviendas();
  const resumen = {
    total: informe.viviendas.length,
    conDerechoVoto: informe.viviendas.filter(v => v.derechoVoto).length,
    votaron: informe.viviendas.filter(v => v.voto).length,
    noVotaron: informe.viviendas.filter(v => v.derechoVoto && !v.voto).length,
    sinDerechoVoto: informe.viviendas.filter(v => !v.derechoVoto).length,
    aFavor: informe.viviendas.filter(v => 
      v.voto && (v.voto.opcionTexto.toLowerCase().includes('favor') || 
                v.voto.opcionTexto.toLowerCase() === 'sí' || 
                v.voto.opcionTexto.toLowerCase() === 'si')
    ).length,
    enContra: informe.viviendas.filter(v => 
      v.voto && (v.voto.opcionTexto.toLowerCase().includes('contra') || 
                v.voto.opcionTexto.toLowerCase() === 'no')
    ).length,
    abstencion: informe.viviendas.filter(v => 
      v.voto && (v.voto.opcionTexto.toLowerCase().includes('abstención') || 
                v.voto.opcionTexto.toLowerCase().includes('abstencion'))
    ).length
  };

  return (
    <div className="informe-participacion">
      <div className="informe-header">
        <h2>Informe de Participación</h2>
        <p>Votación: {informe.votacion.titulo}</p>
        <p>Fecha: {new Date(informe.votacion.fechaFin).toLocaleDateString()}</p>
      </div>
      
      <div className="informe-resumen">
        <div className="resumen-card">
          <div className="resumen-valor">{resumen.total}</div>
          <div className="resumen-texto">Total viviendas</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-valor">{resumen.conDerechoVoto}</div>
          <div className="resumen-texto">Con derecho a voto</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-valor">{resumen.votaron}</div>
          <div className="resumen-texto">Participaron</div>
        </div>
        <div className="resumen-card">
          <div className="resumen-valor">{resumen.noVotaron}</div>
          <div className="resumen-texto">No votaron</div>
        </div>
        <div className="resumen-card a-favor">
          <div className="resumen-valor">{resumen.aFavor}</div>
          <div className="resumen-texto">A favor</div>
        </div>
        <div className="resumen-card en-contra">
          <div className="resumen-valor">{resumen.enContra}</div>
          <div className="resumen-texto">En contra</div>
        </div>
        <div className="resumen-card abstencion">
          <div className="resumen-valor">{resumen.abstencion}</div>
          <div className="resumen-texto">Abstención</div>
        </div>
      </div>
      
      <div className="informe-filtros">
        <label htmlFor="filtro-participacion">Filtrar por:</label>
        <select 
          id="filtro-participacion" 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="todos">Todas las viviendas</option>
          <option value="a-favor">A favor</option>
          <option value="en-contra">En contra</option>
          <option value="abstencion">Abstención</option>
          <option value="no-voto">No votaron</option>
          <option value="sin-derecho">Sin derecho a voto</option>
          <option value="otros">Otros votos</option>
        </select>
      </div>
      
      <div className="informe-tabla-container">
        <table className="informe-tabla">
          <thead>
            <tr>
              <th>Vivienda</th>
              <th>Propietario</th>
              <th>Coeficiente</th>
              <th>Estado</th>
              <th>Usuario que votó</th>
              <th>Fecha del voto</th>
            </tr>
          </thead>
          <tbody>
            {viviendasFiltradas.length > 0 ? (
              viviendasFiltradas.map((vivienda) => {
                const estado = getEstadoVivienda(vivienda);
                return (
                  <tr key={vivienda._id} className={estado.clase}>
                    <td>{vivienda.numeroPuerta}</td>
                    <td>{vivienda.propietario?.nombre || 'No asignado'}</td>
                    <td>{vivienda.coeficiente?.toFixed(3) || 'N/A'}</td>
                    <td>
                      <span className={`estado-badge ${estado.clase}`}>
                        {estado.texto}
                      </span>
                    </td>
                    <td>{vivienda.voto?.usuario?.nombre || '-'}</td>
                    <td>
                      {vivienda.voto?.fechaVoto 
                        ? new Date(vivienda.voto.fechaVoto).toLocaleString() 
                        : '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="no-resultados">
                  No hay viviendas que coincidan con el filtro seleccionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="informe-acciones">
        <button 
          className="btn btn-primary" 
          onClick={() => window.print()}
        >
          Imprimir informe
        </button>
      </div>
    </div>
  );
};

export default InformeParticipacion; 