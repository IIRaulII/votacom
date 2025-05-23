import { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import './ActasList.css';

const ActasList = ({ actas, onDelete }) => {
  const { user } = useAuthContext();
  const [expandedActa, setExpandedActa] = useState(null);
  
  // Verificar si el usuario es admin o superadmin
  const isAdmin = user && (user.rol === 'admin' || user.rol === 'superadmin');
  
  if (!actas || actas.length === 0) {
    return <p className="empty-message">No hay actas disponibles.</p>;
  }
  
  const toggleExpand = (id) => {
    if (expandedActa === id) {
      setExpandedActa(null);
    } else {
      setExpandedActa(id);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleDelete = (id, e) => {
    e.stopPropagation();
    onDelete(id);
  };
  
  return (
    <div className="actas-list">
      {actas.map(acta => (
        <div 
          key={acta._id} 
          className={`acta-item ${expandedActa === acta._id ? 'expanded' : ''}`}
          onClick={() => toggleExpand(acta._id)}
        >
          <div className="acta-header">
            <div className="acta-title">
              <h3>{acta.titulo} <span className="toggle-icon">{expandedActa === acta._id ? '▲' : '▼'}</span></h3>
              <span className="acta-date">Fecha: {formatDate(acta.fecha)}</span>
            </div>
            <div className="acta-actions">
              <a 
                href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${acta.archivoUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-download"
                onClick={(e) => e.stopPropagation()}
              >
                Ver PDF
              </a>
              {isAdmin && (
                <button 
                  className="btn-delete" 
                  onClick={(e) => handleDelete(acta._id, e)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          
          {expandedActa === acta._id && (
            <div className="acta-content">
              <p>{acta.descripcion}</p>
              <div className="acta-meta">
                <span>Comunidad: {acta.comunidad?.nombre || 'No especificada'}</span>
                <span>Creado por: {acta.creador?.nombre || 'Desconocido'}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActasList; 