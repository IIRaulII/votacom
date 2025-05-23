import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { votacionService, actaService } from '../services/api';
import ActasList from '../components/actas/ActasList';
import config from '../utils/config';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuthContext();
  const [votaciones, setVotaciones] = useState({
    activas: [],
    pendientes: [],
    finalizadas: []
  });
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actaToDelete, setActaToDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar votaciones
        try {
          const votacionesResponse = await votacionService.getAll();
          
          if (votacionesResponse.success) {
            // Fecha actual para comparar
            const now = new Date();
            
            // Clasificar votaciones
            const activas = [];
            const pendientes = [];
            const finalizadas = [];
            
            votacionesResponse.data.forEach(votacion => {
              const fechaInicio = new Date(votacion.fechaInicio);
              const fechaFin = new Date(votacion.fechaFin);
              
              if (fechaInicio > now) {
                pendientes.push(votacion);
              } else if (fechaFin < now) {
                finalizadas.push(votacion);
              } else {
                activas.push(votacion);
              }
            });
            
            setVotaciones({ activas, pendientes, finalizadas });
          }
        } catch (err) {
          setError('Error al cargar las votaciones');
        }
        
        // Cargar actas
        try {
          const actasResponse = await actaService.getAll();
          if (actasResponse.success) {
            setActas(actasResponse.data);
          }
        } catch (err) {
          console.error('Error al cargar las actas:', err);
        }
      } catch (err) {
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const renderVotacionesList = (votacionesList, emptyMessage) => {
    if (votacionesList.length === 0) {
      return <p className="empty-message">{emptyMessage}</p>;
    }
    
    return (
      <div className="votaciones-grid">
        {votacionesList.map(votacion => (
          <div key={votacion._id} className="votacion-card">
            <h3>{votacion.titulo}</h3>
            <p className="votacion-descripcion">{votacion.descripcion}</p>
            <div className="votacion-fechas">
              <span>Inicio: {new Date(votacion.fechaInicio).toLocaleDateString()}</span>
              <span>Fin: {new Date(votacion.fechaFin).toLocaleDateString()}</span>
            </div>
            <Link 
              to={config.ROUTES.VOTACION_DETALLE(votacion._id)} 
              className="btn btn-primary"
            >
              Ver detalles
            </Link>
          </div>
        ))}
      </div>
    );
  };

  const confirmDeleteActa = (id) => {
    const acta = actas.find(a => a._id === id);
    setActaToDelete(acta);
    setShowConfirmModal(true);
  };

  const cancelDelete = () => {
    setActaToDelete(null);
    setShowConfirmModal(false);
  };

  const handleDeleteActa = async () => {
    if (!actaToDelete) return;
    
    try {
      setEliminando(true);
      const response = await actaService.delete(actaToDelete._id);
      
      if (response.success) {
        // Actualizar la lista de actas
        setActas(prevActas => prevActas.filter(acta => acta._id !== actaToDelete._id));
        setShowConfirmModal(false);
        setActaToDelete(null);
      } else {
        console.error('Error al eliminar el acta');
      }
    } catch (err) {
      console.error('Error al eliminar el acta:', err);
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {showConfirmModal && actaToDelete && (
        <div className="modal-backdrop">
          <div className="modal-container confirmation-modal">
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="btn-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar el acta <strong>{actaToDelete.titulo}</strong>?</p>
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
                  onClick={handleDeleteActa}
                  disabled={eliminando}
                >
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Bienvenido, {user?.nombre}</h1>
        <p>Aquí puedes ver las actas de las reuniones y el estado de las votaciones de tu comunidad</p>
      </div>
      
      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}
      
      {/* Información de la comunidad - Directamente del objeto de usuario */}
      {user?.comunidad && (
        <div className="comunidad-info-card">
          <h2>Tu comunidad</h2>
          <div className="comunidad-detalles">
            <div className="comunidad-detalle">
              <span className="detalle-label">Nombre:</span>
              <span className="detalle-valor">{user.comunidad.nombre || 'No especificado'}</span>
            </div>
            {user?.vivienda && (
              <>
                <div className="comunidad-detalle">
                  <span className="detalle-label">Tu vivienda:</span>
                  <span className="detalle-valor">Puerta {user.vivienda.numeroPuerta}</span>
                </div>
                <div className="comunidad-detalle">
                  <span className="detalle-label">Coeficiente:</span>
                  <span className="detalle-valor">{user.vivienda.coeficiente ? `${user.vivienda.coeficiente}%` : 'No especificado'}</span>
                </div>
                <div className="comunidad-detalle">
                  <span className="detalle-label">Derecho a voto:</span>
                  <span className="detalle-valor">{user.vivienda.derechoVoto ? 'Sí' : 'No'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{votaciones.activas.length}</div>
          <div className="stat-label">Votaciones activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{votaciones.pendientes.length}</div>
          <div className="stat-label">Próximas votaciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{votaciones.finalizadas.length}</div>
          <div className="stat-label">Votaciones finalizadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{actas.length}</div>
          <div className="stat-label">Actas disponibles</div>
        </div>
      </div>
      
      <section className="dashboard-section">
        <h2>Votaciones activas</h2>
        {renderVotacionesList(votaciones.activas, 'No hay votaciones activas en este momento.')}
      </section>
      
      <section className="dashboard-section">
        <h2>Próximas votaciones</h2>
        {renderVotacionesList(votaciones.pendientes, 'No hay votaciones programadas próximamente.')}
      </section>
      
      <section className="dashboard-section">
        <h2>Actas de reuniones</h2>
        <ActasList actas={actas} onDelete={confirmDeleteActa} />
        
        {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
          <div className="admin-actions">
            <Link to={config.ROUTES.ADMIN.NUEVA_ACTA} className="btn btn-secondary">
              Subir nueva acta
            </Link>
          </div>
        )}
      </section>
      
      <section className="dashboard-section">
        <h2>Votaciones finalizadas</h2>
        {renderVotacionesList(votaciones.finalizadas, 'No hay votaciones finalizadas.')}
      </section>
      
      {user?.rol === 'admin' && (
        <div className="admin-actions">
          <Link to={config.ROUTES.ADMIN.NUEVA_VOTACION} className="btn btn-secondary">
            Crear nueva votación
          </Link>
          <Link to={config.ROUTES.ADMIN.VOTACIONES} className="btn btn-primary">
            Administrar votaciones
          </Link>
        </div>
      )}
      
      {user?.rol === 'superadmin' && (
        <div className="admin-actions superadmin-actions">
          <Link to={config.ROUTES.ADMIN.NUEVA_VOTACION} className="btn btn-secondary">
            Crear nueva votación
          </Link>
          <Link to={config.ROUTES.ADMIN.VOTACIONES} className="btn btn-primary">
            Administrar votaciones
          </Link>
          <Link to={config.ROUTES.ADMIN.COMUNIDADES} className="btn btn-primary">
            Gestionar comunidades
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 