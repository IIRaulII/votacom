import React, { useState } from 'react';
import './PDFViewer.css';

const PDFViewer = ({ fileUrl, title, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Error al cargar el archivo PDF');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title || 'documento.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <h3>{title || 'Visualizar Documento'}</h3>
          <div className="pdf-viewer-actions">
            <button 
              className="pdf-viewer-btn pdf-viewer-download"
              onClick={handleDownload}
              title="Descargar PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar
            </button>
            <button 
              className="pdf-viewer-btn pdf-viewer-close"
              onClick={onClose}
              title="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="pdf-viewer-content">
          {isLoading && (
            <div className="pdf-viewer-loading">
              <div className="spinner"></div>
              <p>Cargando documento...</p>
            </div>
          )}
          
          {error && (
            <div className="pdf-viewer-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p>{error}</p>
              <button 
                className="pdf-viewer-btn pdf-viewer-retry"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                }}
              >
                Reintentar
              </button>
            </div>
          )}
          
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="pdf-viewer-iframe"
            onLoad={handleLoad}
            onError={handleError}
            title={title || 'Documento PDF'}
            style={{ display: isLoading || error ? 'none' : 'block' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 