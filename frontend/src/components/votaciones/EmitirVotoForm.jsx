import { useState } from 'react';
import { votacionService } from '../../services/api';
import './EmitirVotoForm.css';

const EmitirVotoForm = ({ votacion, onVotoEmitido }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [votoRegistrado, setVotoRegistrado] = useState(false);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOption) {
      setError('Debes seleccionar una opción para votar');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const votoData = {
        opcionId: selectedOption
      };
      
      const response = await votacionService.emitirVoto(votacion._id, votoData);
      
      if (response.success) {
        setVotoRegistrado(true);
        
        // Permitir que el mensaje de éxito se vea por un momento
        setTimeout(() => {
          if (onVotoEmitido) {
            // Pasar la votación actualizada y los resultados parciales al callback
            const votacionActualizada = response.data?.votacion || null;
            const resultadosParciales = response.data?.resultadosParciales || null;
            
            onVotoEmitido(votacionActualizada, resultadosParciales);
          }
        }, 1500);
      } else {
        setError(response.message || 'Error al emitir el voto');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al emitir el voto. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar el texto de la opción según su contenido
  const getOptionIcon = (texto) => {
    const lowerText = texto.toLowerCase();
    
    if (lowerText.includes('favor') || lowerText.includes('sí') || lowerText.includes('si') || lowerText.includes('a favor')) {
      return '👍';
    } else if (lowerText.includes('contra') || lowerText.includes('no') || lowerText.includes('en contra')) {
      return '👎';
    } else if (lowerText.includes('abstención') || lowerText.includes('abstencion')) {
      return '✋';
    }
    
    return '•';
  };

  if (votoRegistrado) {
    return (
      <div className="voto-registrado">
        <div className="voto-success-icon">✓</div>
        <h3>¡Voto registrado correctamente!</h3>
        <p>Tu voto ha sido contabilizado. Gracias por participar.</p>
      </div>
    );
  }

  return (
    <div className="emitir-voto-form">
      {error && (
        <div className="voto-error">
          <span className="error-icon">⚠️</span> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <p className="opciones-label">Selecciona una opción:</p>
          <div className="opciones-list">
            {votacion.opciones && votacion.opciones.map((opcion, index) => (
              <div 
                key={opcion._id || index} 
                className={`opcion-item ${selectedOption === (opcion._id || index.toString()) ? 'selected' : ''}`}
                onClick={() => setSelectedOption(opcion._id || index.toString())}
              >
                <span className="opcion-icon">{getOptionIcon(opcion.texto)}</span>
                <span className="opcion-texto">{opcion.texto}</span>
                <span className="check-indicator"></span>
                
                {/* Input oculto para mantener la funcionalidad del formulario */}
                <input
                  type="radio"
                  id={`opcion-${opcion._id || index}`}
                  name="opcionVoto"
                  value={opcion._id || index.toString()}
                  checked={selectedOption === (opcion._id || index.toString())}
                  onChange={handleOptionChange}
                  className="opcion-radio-hidden"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="voto-mensaje">
          <p><strong>Importante:</strong> Una vez emitido tu voto, no podrás cambiarlo.</p>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary voto-submit"
          disabled={loading || !selectedOption}
        >
          {loading ? (
            <>
              <span className="loading-spinner-small"></span>
              <span>Enviando voto...</span>
            </>
          ) : (
            <>
              <span className="submit-icon">✓</span>
              <span>Enviar voto</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default EmitirVotoForm; 