import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import FacturasList from '../../components/facturas/FacturasList';
import { facturaService } from '../../services/api';
import './FacturasPage.css';

export const FacturasPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchFacturas = async () => {
      try {
        setLoading(true);
        const response = await facturaService.getAll();
        
        if (response.success) {
          setFacturas(response.data);
        } else {
          setError('No se pudieron cargar las facturas');
        }
      } catch (err) {
        setError('Error al cargar las facturas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacturas();
  }, []);

  const confirmDelete = (id) => {
    const factura = facturas.find(f => f._id === id);
    setFacturaToDelete(factura);
    setShowConfirmModal(true);
  };

  const cancelDelete = () => {
    setFacturaToDelete(null);
    setShowConfirmModal(false);
  };

  const handleDeleteFactura = async () => {
    if (!facturaToDelete) return;
    
    try {
      setEliminando(true);
      const response = await facturaService.delete(facturaToDelete._id);
      
      if (response.success) {
        // Actualizar la lista de facturas
        setFacturas(prevFacturas => prevFacturas.filter(factura => factura._id !== facturaToDelete._id));
        setShowConfirmModal(false);
        setFacturaToDelete(null);
      } else {
        setError('Error al eliminar la factura');
      }
    } catch (err) {
      setError('Error al eliminar la factura');
      console.error(err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="facturas-page">
      {showConfirmModal && facturaToDelete && (
        <div className="modal-backdrop">
          <div className="modal-container confirmation-modal">
            <div className="modal-header">
              <h2>Confirmar eliminación</h2>
              <button className="btn-close" onClick={cancelDelete}>×</button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la factura <strong>{facturaToDelete.titulo}</strong>?</p>
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
                  onClick={handleDeleteFactura}
                  disabled={eliminando}
                >
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
      <div className="facturas-header">
        <h1>Facturas de la Comunidad</h1>
        {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
          <Link to="/admin/facturas/nueva" className="btn btn-primary">
            <i className="fas fa-plus"></i> Nueva Factura
          </Link>
        )}
      </div>

      <div className="facturas-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando facturas...</p>
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
        ) : facturas.length === 0 ? (
          <div className="no-facturas-message">
            <p>No hay facturas disponibles en esta comunidad.</p>
            {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
              <p>Como administrador, puedes crear la primera factura haciendo clic en "Nueva Factura".</p>
            )}
          </div>
        ) : (
          <FacturasList facturas={facturas} onDelete={confirmDelete} />
        )}
      </div>
    </div>
  );
};

export default FacturasPage; 