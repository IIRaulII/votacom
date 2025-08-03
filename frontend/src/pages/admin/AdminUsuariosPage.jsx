import { useState, useEffect } from 'react';
import { usuarioService, viviendaService, comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import './AdminUsuarios.css';

const AdminUsuariosPage = () => {
  const { user } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [comunidadSeleccionada, setComunidadSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'vecino',
    viviendaId: '',
    comunidadId: ''
  });
  const [formError, setFormError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  
  const esSuperAdmin = user && user.rol === 'superadmin';
  
  useEffect(() => {
    // Si es superadmin, cargar lista de comunidades
    if (esSuperAdmin) {
      fetchComunidades();
    } else if (user && user.comunidad) {
      // Si es admin normal, usar su comunidad directamente
      setComunidadSeleccionada(user.comunidad._id || user.comunidad);
      fetchData(user.comunidad._id || user.comunidad);
    } else {
      fetchData();
    }
  }, [esSuperAdmin, user]);
  
  const fetchComunidades = async () => {
    try {
      setLoading(true);
      const response = await comunidadService.getAll();
      
      if (response.success) {
        setComunidades(response.data);
        // Si hay comunidades disponibles, seleccionar la primera por defecto
        if (response.data.length > 0) {
          const primeraId = response.data[0]._id;
          setComunidadSeleccionada(primeraId);
          fetchData(primeraId);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las comunidades');
      console.error(err);
      setLoading(false);
    }
  };
  
  const handleChangeComunidad = (e) => {
    const comunidadId = e.target.value;
    setComunidadSeleccionada(comunidadId);
    // Si se selecciona "Selecciona una comunidad", pasar null para cargar todos los usuarios
    fetchData(comunidadId || null);
  };
  
  const fetchData = async (comunidadId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener usuarios
      const params = {};
      if (comunidadId) {
        params.comunidad = comunidadId;
      }
      
      const usuariosResponse = await usuarioService.getAll(params);
      
      if (usuariosResponse.success) {
        setUsuarios(usuariosResponse.data);
      }
      
      // Obtener viviendas (filtradas por la misma comunidad si hay una seleccionada)
      const viviendasResponse = await viviendaService.getAll(params);
      
      if (viviendasResponse.success) {
        setViviendas(viviendasResponse.data);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol || 'vecino',
      viviendaId: usuario.vivienda?._id || '',
      comunidadId: usuario.comunidad?._id || (typeof usuario.comunidad === 'string' ? usuario.comunidad : '')
    });
    setFormError(null);
    setModalVisible(true);
  };
  
  const handleDeleteClick = (usuario) => {
    setSelectedUsuario(usuario);
    setDeleteModalVisible(true);
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
      setProcesando(true);
      setFormError(null);
      
      const dataToUpdate = {
        nombre: formData.nombre,
        email: formData.email,
        rol: formData.rol,
        ...(formData.viviendaId ? { viviendaId: formData.viviendaId } : {}),
        ...(esSuperAdmin && formData.comunidadId ? { comunidadId: formData.comunidadId } : {})
      };
      
      const response = await usuarioService.update(selectedUsuario._id, dataToUpdate);
      
      if (response.success) {
        // Actualizar la lista de usuarios con los datos actualizados
        setUsuarios(prevUsuarios => 
          prevUsuarios.map(u => 
            u._id === selectedUsuario._id 
              ? { 
                  ...u, 
                  nombre: formData.nombre, 
                  email: formData.email, 
                  rol: formData.rol,
                  vivienda: formData.viviendaId 
                    ? viviendas.find(v => v._id === formData.viviendaId) 
                    : null,
                  comunidad: formData.comunidadId
                    ? comunidades.find(c => c._id === formData.comunidadId)
                    : u.comunidad
                } 
              : u
          )
        );
        setModalVisible(false);
      } else {
        setFormError(response.message || 'Error al actualizar el usuario');
      }
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Error al actualizar el usuario');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setProcesando(true);
      
      const response = await usuarioService.delete(selectedUsuario._id);
      
      if (response.success) {
        setUsuarios(prevUsuarios => prevUsuarios.filter(u => u._id !== selectedUsuario._id));
        setDeleteModalVisible(false);
      } else {
        setError(response.message || 'Error al eliminar el usuario');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al eliminar el usuario');
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };
  
  if (loading && usuarios.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administración de Usuarios</h1>
        <p>Gestiona los usuarios de la comunidad</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      {/* Selector de comunidad para superadmin */}
      {esSuperAdmin && (
        <div className="selector-comunidad">
          <label htmlFor="comunidad">Seleccionar Comunidad:</label>
          <select 
            id="comunidad" 
            value={comunidadSeleccionada} 
            onChange={handleChangeComunidad}
            className="selector-comunidad-input"
          >
            <option value="">Mostrar todos</option>
            {comunidades.map(comunidad => (
              <option key={comunidad._id} value={comunidad._id}>
                {comunidad.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{usuarios.length}</div>
            <div className="stat-label">Total de usuarios</div>
          </div>
        </div>
        
        <div className="admin-data-container">
          <h2>Listado de usuarios</h2>
          
          {usuarios.length === 0 ? (
            <p className="empty-message">No hay usuarios registrados.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Vivienda</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(usuario => (
                    <tr key={usuario._id}>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <span className={`role-badge ${usuario.rol}`}>
                          {usuario.rol === 'admin' ? 'Administrador' : usuario.rol === 'superadmin' ? 'Super Admin' : 'Vecino'}
                        </span>
                      </td>
                      <td>{usuario.vivienda ? 
                          (typeof usuario.vivienda === 'object' && usuario.vivienda._id 
                            ? `Puerta: ${usuario.vivienda.numeroPuerta || 'Sin número'}` 
                            : `ID: ${usuario.vivienda}`
                          ) 
                          : 'Sin asignar'}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleEditClick(usuario)}
                        >
                          <span className="icon">✏️</span>
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDeleteClick(usuario)}
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
      
      {/* Modal de Edición */}
      {modalVisible && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Editar Usuario</h2>
              <button 
                className="btn-close"
                onClick={() => setModalVisible(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nombre">Nombre:</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    autoComplete="given-name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rol">Rol:</label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                  >
                    <option value="vecino">Vecino</option>
                    <option value="admin">Administrador</option>
                    {esSuperAdmin && (
                      <option value="superadmin">Super Admin</option>
                    )}
                  </select>
                </div>
                
                {esSuperAdmin && (
                  <div className="form-group">
                    <label htmlFor="comunidadId">Comunidad:</label>
                    <select
                      id="comunidadId"
                      name="comunidadId"
                      value={formData.comunidadId || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Sin asignar</option>
                      {comunidades.map(comunidad => (
                        <option key={comunidad._id} value={comunidad._id}>
                          {comunidad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="viviendaId">Vivienda:</label>
                  <select
                    id="viviendaId"
                    name="viviendaId"
                    value={formData.viviendaId}
                    onChange={handleInputChange}
                  >
                    <option value="">Sin asignar</option>
                    {viviendas.map(vivienda => (
                      <option key={vivienda._id} value={vivienda._id}>
                        Puerta: {vivienda.numeroPuerta} (Coef: {vivienda.coeficiente})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalVisible(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={procesando}
                  >
                    {procesando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Confirmación de Eliminación */}
      {deleteModalVisible && (
        <div className="modal-backdrop">
          <div className="modal-container confirmation-modal">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button 
                className="btn-close"
                onClick={() => setDeleteModalVisible(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUsuario?.nombre}</strong>?</p>
              <p>Esta acción no se puede deshacer.</p>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModalVisible(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={procesando}
                >
                  {procesando ? 'Eliminando...' : 'Eliminar Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuariosPage; 