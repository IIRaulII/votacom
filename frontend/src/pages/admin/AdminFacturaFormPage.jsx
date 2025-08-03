import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facturaService } from '../../services/api';
import FacturaForm from '../../components/facturas/FacturaForm';
import config from '../../utils/config';
import './AdminFacturaForm.css';

const AdminFacturaFormPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await facturaService.create(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(config.ROUTES.DASHBOARD);
        }, 2000);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al crear la factura');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Subir nueva factura</h1>
        <p>Sube una factura en formato PDF</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="admin-success">
          Factura subida correctamente. Redirigiendo al dashboard...
        </div>
      )}
      
      <FacturaForm onSubmit={handleSubmit} />
      
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

export default AdminFacturaFormPage; 