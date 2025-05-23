import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { actaService } from '../../services/api';
import ActaForm from '../../components/actas/ActaForm';
import config from '../../utils/config';
import './AdminActaForm.css';

const AdminActaFormPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await actaService.create(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(config.ROUTES.DASHBOARD);
        }, 2000);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al crear el acta');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Subir nueva acta</h1>
        <p>Sube un acta de reunión en formato PDF</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="admin-success">
          Acta subida correctamente. Redirigiendo al dashboard...
        </div>
      )}
      
      <ActaForm onSubmit={handleSubmit} />
      
      <div className="admin-actions">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate(config.ROUTES.DASHBOARD)}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default AdminActaFormPage; 