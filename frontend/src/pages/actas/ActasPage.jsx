import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import ActasList from '../../components/actas/ActasList';
import { actaService } from '../../services/api';
import './ActasPage.css';

export const ActasPage = () => {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actaToDelete, setActaToDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchActas = async () => {
      try {
        setLoading(true);
        const response = await actaService.getAll();
        
        if (response.success) {
          setActas(response.data);
        } else {
          setError('No se pudieron cargar las actas');
        }
      } catch (err) {
        setError('Error al cargar las actas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActas();
  }, []);

  const confirmDelete = (id) => {
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
        setError('Error al eliminar el acta');
      }
    } catch (err) {
      setError('Error al eliminar el acta');
      console.error(err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="actas-page">
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
    
      <div className="actas-header">
        <h1>Actas de la Comunidad</h1>
        {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
          <Link to="/admin/actas/nueva" className="btn btn-primary">
            <i className="fas fa-plus"></i> Nueva Acta
          </Link>
        )}
      </div>

      <div className="actas-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando actas...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Reintentar
            </button>
          </div>
        ) : actas.length === 0 ? (
          <div className="no-actas-message">
            <p>No hay actas disponibles en esta comunidad.</p>
            {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
              <p>Como administrador, puedes crear la primera acta haciendo clic en "Nueva Acta".</p>
            )}
          </div>
        ) : (
          <ActasList actas={actas} onDelete={confirmDelete} />
        )}
      </div>
    </div>
  );
};

export default ActasPage; 