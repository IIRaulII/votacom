import { useState, useEffect } from 'react';
import { votacionService } from '../../services/api';
import VotacionesList from '../../components/votaciones/VotacionesList';
import './VotacionesPage.css';

const VotacionesPage = () => {
  const [votaciones, setVotaciones] = useState({
    todas: [],
    activas: [],
    pendientes: [],
    finalizadas: []
  });
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const fetchVotaciones = async () => {
      try {
        setLoading(true);
        const response = await votacionService.getAll();
        
        if (response.success) {
          // Fecha actual para comparar
          const now = new Date();
          
          // Clasificar votaciones
          const activas = [];
          const pendientes = [];
          const finalizadas = [];
          
          // Procesar todas las votaciones
          const todasProcesadas = await Promise.all(response.data.map(async (votacion) => {
            const fechaInicio = new Date(votacion.fechaInicio);
            const fechaFin = new Date(votacion.fechaFin);
            
            // Clasificar la votación según su estado
            if (fechaInicio > now) {
              pendientes.push(votacion);
            } else if (fechaFin < now) {
              // Para votaciones finalizadas, intentar cargar los resultados
              try {
                const resultadosResponse = await votacionService.getResultados(votacion._id);
                if (resultadosResponse.success) {
                  // Añadir los resultados a la votación
                  votacion.resultados = resultadosResponse.data;
                }
              } catch (err) {
                // Error silencioso al cargar resultados
              }
              finalizadas.push(votacion);
            } else {
              activas.push(votacion);
            }
            
            return votacion;
          }));
          
          setVotaciones({
            todas: todasProcesadas,
            activas,
            pendientes,
            finalizadas
          });
        }
      } catch (err) {
        setError('Error al cargar las votaciones');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVotaciones();
  }, []);

  const filtrarVotaciones = () => {
    let listaFiltrada = votaciones[filtro];
    
    if (busqueda.trim() !== '') {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      listaFiltrada = listaFiltrada.filter(
        votacion => 
          votacion.titulo.toLowerCase().includes(terminoBusqueda) ||
          votacion.descripcion.toLowerCase().includes(terminoBusqueda)
      );
    }
    
    return listaFiltrada;
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleFiltroChange = (e) => {
    setFiltro(e.target.value);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando votaciones...</p>
      </div>
    );
  }

  return (
    <div className="votaciones-page">
      <div className="votaciones-header">
        <h1>Votaciones</h1>
        <p>Consulta las votaciones activas y pasadas de tu comunidad</p>
      </div>
      
      {error && (
        <div className="votaciones-error">
          {error}
        </div>
      )}
      
      <div className="votaciones-controles">
        <div className="votaciones-filtro">
          <label htmlFor="filtro">Estado:</label>
          <select 
            id="filtro" 
            value={filtro} 
            onChange={handleFiltroChange}
            className="filtro-select"
          >
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="pendientes">Pendientes</option>
            <option value="finalizadas">Finalizadas</option>
          </select>
        </div>
        
        <div className="votaciones-busqueda">
          <input
            type="text"
            placeholder="Buscar votaciones..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="busqueda-input"
          />
        </div>
      </div>
      
      <div className="votaciones-estadisticas">
        <div className="estadistica-item">
          <span className="estadistica-valor">{votaciones.todas.length}</span>
          <span className="estadistica-texto">Total</span>
        </div>
        <div className="estadistica-item activas">
          <span className="estadistica-valor">{votaciones.activas.length}</span>
          <span className="estadistica-texto">Activas</span>
        </div>
        <div className="estadistica-item pendientes">
          <span className="estadistica-valor">{votaciones.pendientes.length}</span>
          <span className="estadistica-texto">Pendientes</span>
        </div>
        <div className="estadistica-item finalizadas">
          <span className="estadistica-valor">{votaciones.finalizadas.length}</span>
          <span className="estadistica-texto">Finalizadas</span>
        </div>
      </div>
      
      <div className="votaciones-contenido">
        <VotacionesList 
          votaciones={filtrarVotaciones()} 
          emptyMessage={`No se encontraron votaciones ${filtro !== 'todas' ? `${filtro}` : ''}.`}
        />
      </div>
    </div>
  );
};

export default VotacionesPage; 