import { useState, useEffect } from 'react';
import { comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import './AdminComunidades.css';

const AdminComunidadesPage = () => {
  const { user } = useAuthContext();
  const [comunidades, setComunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentComunidad, setCurrentComunidad] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    cif: ''
  });
  
  useEffect(() => {
    fetchComunidades();
  }, []);
  
  const fetchComunidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await comunidadService.getAll();
      
      if (response.success) {
        setComunidades(response.data);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las comunidades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (comunidad = null) => {
    if (comunidad) {
      setCurrentComunidad(comunidad);
      setFormData({
        nombre: comunidad.nombre || '',
        direccion: comunidad.direccion || '',
        cif: comunidad.cif || ''
      });
    } else {
      setCurrentComunidad(null);
      setFormData({
        nombre: '',
        direccion: '',
        cif: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentComunidad(null);
    setFormData({
      nombre: '',
      direccion: '',
      cif: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validar datos
      if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.cif.trim()) {
        setError('Todos los campos son obligatorios');
        setLoading(false);
        return;
      }
      
      let response;
      if (currentComunidad) {
        // Actualizar comunidad existente
        response = await comunidadService.update(currentComunidad._id, formData);
      } else {
        // Crear nueva comunidad
        response = await comunidadService.create(formData);
      }
      
      if (response.success) {
        fetchComunidades();
        handleCloseModal();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al guardar la comunidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta comunidad? Esta acción no se puede deshacer y eliminará todos los datos asociados.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await comunidadService.delete(id);
      
      if (response.success) {
        fetchComunidades();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al eliminar la comunidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario es superadmin
  if (user && user.rol !== 'superadmin') {
    return (
      <div className="admin-page">
        <div className="admin-error">
          No tienes permisos para acceder a esta página. Se requiere rol de superadministrador.
        </div>
      </div>
    );
  }
  
  if (loading && comunidades.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando comunidades...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administración de Comunidades</h1>
        <p>Gestiona las comunidades de la plataforma</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{comunidades.length}</div>
            <div className="stat-label">Total de comunidades</div>
          </div>
        </div>
        
        <div className="admin-data-container">
          <div className="admin-data-header">
            <h2>Listado de comunidades</h2>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              Agregar comunidad
            </button>
          </div>
          
          {comunidades.length === 0 ? (
            <p className="empty-message">No hay comunidades registradas.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>CIF</th>
                    <th>Código</th>
                    <th>Administradores</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comunidades.map(comunidad => (
                    <tr key={comunidad._id}>
                      <td>{comunidad.nombre || '-'}</td>
                      <td>{comunidad.direccion || '-'}</td>
                      <td>{comunidad.cif || '-'}</td>
                      <td>
                        <span className="codigo-comunidad">{comunidad.codigo}</span>
                      </td>
                      <td>
                        {comunidad.administradores && comunidad.administradores.length > 0 
                          ? comunidad.administradores.map(a => a.nombre).join(', ') 
                          : 'Sin administradores'}
                      </td>
                      <td className="actions-cell">
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleOpenModal(comunidad)}
                          title="Editar comunidad"
                        >
                          <span className="icon">✏️</span>
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(comunidad._id)}
                          title="Eliminar comunidad"
                        >
                          <span className="icon">🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para agregar/editar comunidad */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{currentComunidad ? 'Editar Comunidad' : 'Agregar Comunidad'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre de la comunidad:</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Comunidad de Propietarios Calle Mayor 1"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="direccion">Dirección:</label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Calle Mayor 1, 28001 Madrid"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cif">CIF/NIF:</label>
                <input
                  type="text"
                  id="cif"
                  name="cif"
                  value={formData.cif}
                  onChange={handleInputChange}
                  placeholder="Ej: H12345678"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentComunidad ? 'Actualizar' : 'Crear'} Comunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComunidadesPage; 