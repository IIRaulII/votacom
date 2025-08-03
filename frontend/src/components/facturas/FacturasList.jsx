import { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import PDFViewer from '../utils/PDFViewer';
import './FacturasList.css';

const FacturasList = ({ facturas, onDelete }) => {
  const { user } = useAuthContext();
  const [expandedFactura, setExpandedFactura] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);
  
  // Verificar si el usuario es admin o superadmin
  const isAdmin = user && (user.rol === 'admin' || user.rol === 'superadmin');
  
  if (!facturas || facturas.length === 0) {
    return <p className="empty-message">No hay facturas disponibles.</p>;
  }
  
  const toggleExpand = (id) => {
    if (expandedFactura === id) {
      setExpandedFactura(null);
    } else {
      setExpandedFactura(id);
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

  const handleViewPDF = (factura, e) => {
    e.stopPropagation();
    const fullUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${factura.archivoUrl}`;
    setSelectedPDF({
      url: fullUrl,
      title: factura.titulo
    });
  };
  
  return (
    <div className="facturas-list">
      {facturas.map(factura => (
        <div 
          key={factura._id} 
          className={`factura-item ${expandedFactura === factura._id ? 'expanded' : ''}`}
          onClick={() => toggleExpand(factura._id)}
        >
          <div className="factura-header">
            <div className="factura-title">
              <h3>{factura.titulo} <span className="toggle-icon">{expandedFactura === factura._id ? '▲' : '▼'}</span></h3>
              <span className="factura-date">Fecha: {formatDate(factura.fecha)}</span>
            </div>
            <div className="factura-actions">
              <button 
                className="btn-download"
                onClick={(e) => handleViewPDF(factura, e)}
              >
                Ver PDF
              </button>
              {isAdmin && (
                <button 
                  className="btn-delete" 
                  onClick={(e) => handleDelete(factura._id, e)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          
          {expandedFactura === factura._id && (
            <div className="factura-content">
              <p>{factura.descripcion}</p>
              <div className="factura-meta">
                <span>Comunidad: {factura.comunidad?.nombre || 'No especificada'}</span>
                <span>Creado por: {factura.creador?.nombre || 'Desconocido'}</span>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {selectedPDF && (
        <PDFViewer
          fileUrl={selectedPDF.url}
          title={selectedPDF.title}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
};

export default FacturasList; 