import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { votacionService, comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './AdminVotaciones.css';

const AdminVotacionesPage = () => {
  const { user } = useAuthContext();
  const [votaciones, setVotaciones] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [comunidadSeleccionada, setComunidadSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [votacionToDelete, setVotacionToDelete] = useState(null);
  
  const esSuperAdmin = user && user.rol === 'superadmin';
  
  useEffect(() => {
    // Si es superadmin, cargar lista de comunidades
    if (esSuperAdmin) {
      fetchComunidades();
    } else if (user && user.comunidad) {
      // Si es admin normal, usar su comunidad directamente
      setComunidadSeleccionada(user.comunidad._id || user.comunidad);
      fetchVotaciones({ comunidad: user.comunidad._id || user.comunidad });
    } else {
      fetchVotaciones();
    }
  }, [esSuperAdmin, user]);
  
  const fetchComunidades = async () => {
    try {
      setLoading(true);
      const response = await comunidadService.getAll();
      
      if (response.success) {
        setComunidades(response.data);
        // Si hay comunidades disponibles, seleccionar la primera por defecto
        if (response.data.length > 0) {
          const primeraId = response.data[0]._id;
          setComunidadSeleccionada(primeraId);
          fetchVotaciones({ comunidad: primeraId });
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las comunidades');
      setLoading(false);
    }
  };
  
  const handleChangeComunidad = (e) => {
    const comunidadId = e.target.value;
    setComunidadSeleccionada(comunidadId);
    // Si se selecciona "Mostrar todas", pasar null para cargar todas las votaciones
    fetchVotaciones(comunidadId ? { comunidad: comunidadId } : {});
  };
  
  const fetchVotaciones = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await votacionService.getAll(params);
      
      if (response.success) {
        setVotaciones(response.data);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las votaciones');
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDelete = (votacion) => {
    setVotacionToDelete(votacion);
    setShowConfirmModal(true);
  };
  
  const cancelDelete = () => {
    setVotacionToDelete(null);
    setShowConfirmModal(false);
  };
  
  const handleEliminarVotacion = async () => {
    if (!votacionToDelete) return;
    
    try {
      setEliminando(true);
      setError(null);
      
      const response = await votacionService.delete(votacionToDelete._id);
      
      if (response.success) {
        // Actualizar la lista de votaciones eliminando la que se acaba de borrar
        setVotaciones(prevVotaciones => prevVotaciones.filter(v => v._id !== votacionToDelete._id));
        setShowConfirmModal(false);
        setVotacionToDelete(null);
      } else {
        setError(response.message || 'Error al eliminar la votación');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al eliminar la votación');
    } finally {
      setEliminando(false);
    }
  };
  
  const getEstadoVotacion = (votacion) => {
    const now = new Date();
    const fechaInicio = new Date(votacion.fechaInicio);
    const fechaFin = new Date(votacion.fechaFin);
    
    if (fechaInicio > now) {
      return 'pendiente';
    } else if (fechaFin < now) {
      return 'finalizada';
    } else {
      return 'activa';
    }
  };
  
  if (loading && votaciones.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando votaciones...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      {showConfirmModal && votacionToDelete && (
        <div className="modal-backdrop">
          <div className="modal-container confirmation-modal">
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="btn-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la votación <strong>{votacionToDelete.titulo}</strong>?</p>
              <p className="text-warning">Esta acción no se puede deshacer.</p>
              
              <div className="form-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={cancelDelete} 
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleEliminarVotacion}
                  disabled={eliminando}
                >
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      <div className="admin-header">
        <h1>Administración de Votaciones</h1>
        <p>Gestiona las votaciones de la comunidad</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      {/* Selector de comunidad para superadmin */}
      {esSuperAdmin && (
        <div className="selector-comunidad">
          <label htmlFor="comunidad">Seleccionar Comunidad:</label>
          <select 
            id="comunidad" 
            value={comunidadSeleccionada} 
            onChange={handleChangeComunidad}
            className="selector-comunidad-input"
          >
            <option value="">Mostrar todas</option>
            {comunidades.map(comunidad => (
              <option key={comunidad._id} value={comunidad._id}>
                {comunidad.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{votaciones.length}</div>
            <div className="stat-label">Total de votaciones</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {votaciones.filter(v => getEstadoVotacion(v) === 'activa').length}
            </div>
            <div className="stat-label">Votaciones activas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {votaciones.filter(v => getEstadoVotacion(v) === 'pendiente').length}
            </div>
            <div className="stat-label">Votaciones pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {votaciones.filter(v => getEstadoVotacion(v) === 'finalizada').length}
            </div>
            <div className="stat-label">Votaciones finalizadas</div>
          </div>
        </div>
        
        <div className="admin-data-container">
          <div className="admin-data-header">
            <h2>Listado de votaciones</h2>
            <Link 
              to={config.ROUTES.ADMIN.NUEVA_VOTACION} 
              className="btn btn-primary"
            >
              Crear votación
            </Link>
          </div>
          
          {eliminando && (
            <div className="admin-loading-overlay">
              <div className="loading-spinner"></div>
              <p>Eliminando votación...</p>
            </div>
          )}
          
          {votaciones.length === 0 ? (
            <p className="empty-message">No hay votaciones registradas.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Estado</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Sistema</th>
                    <th>Mayoría</th>
                    <th>Opciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {votaciones.map(votacion => {
                    const estado = getEstadoVotacion(votacion);
                    
                    return (
                      <tr key={votacion._id}>
                        <td>{votacion.titulo}</td>
                        <td>
                          <span className={`estado-badge ${estado}`}>
                            {estado === 'activa' && 'Activa'}
                            {estado === 'pendiente' && 'Pendiente'}
                            {estado === 'finalizada' && 'Finalizada'}
                          </span>
                        </td>
                        <td>{new Date(votacion.fechaInicio).toLocaleDateString()}</td>
                        <td>{new Date(votacion.fechaFin).toLocaleDateString()}</td>
                        <td>{votacion.sistemaRecuento === 'coeficiente' ? 'Por coeficiente' : 'Por vivienda'}</td>
                        <td>
                          {votacion.tipoMayoria === 'simple' && 'Simple'}
                          {votacion.tipoMayoria === 'tres_quintos' && 'Tres quintos (3/5)'}
                          {votacion.tipoMayoria === 'unanimidad' && 'Unanimidad'}
                        </td>
                        <td>{votacion.opciones?.length || 0}</td>
                        <td className="actions-cell">
                          <Link 
                            to={config.ROUTES.VOTACION_DETALLE(votacion._id)}
                            className="btn-icon view"
                          >
                            <span className="icon">👁️</span>
                          </Link>
                          
                          {estado !== 'finalizada' && (
                            <Link 
                              to={config.ROUTES.ADMIN.EDITAR_VOTACION(votacion._id)}
                              className="btn-icon edit"
                            >
                              <span className="icon">✏️</span>
                            </Link>
                          )}
                          
                          <button 
                            className="btn-icon delete"
                            onClick={() => confirmDelete(votacion)}
                            disabled={eliminando}
                          >
                            <span className="icon">🗑️</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVotacionesPage; 