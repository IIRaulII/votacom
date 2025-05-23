import { useState, useEffect } from 'react';
import { viviendaService, comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import './AdminViviendas.css';

const AdminViviendasPage = () => {
  const { user } = useAuthContext();
  const [viviendas, setViviendas] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [comunidadSeleccionada, setComunidadSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentVivienda, setCurrentVivienda] = useState(null);
  const [formData, setFormData] = useState({
    numeroPuerta: '',
    coeficiente: '',
    derechoVoto: true,
    comunidad: ''
  });
  const [sumaCoeficientes, setSumaCoeficientes] = useState(0);
  const [coeficienteDisponible, setCoeficienteDisponible] = useState(100);
  
  const esSuperAdmin = user && user.rol === 'superadmin';
  
  useEffect(() => {
    // Si es superadmin, cargar lista de comunidades
    if (esSuperAdmin) {
      fetchComunidades();
    } else if (user && user.comunidad) {
      // Si es admin normal, usar su comunidad directamente
      setComunidadSeleccionada(user.comunidad._id || user.comunidad);
      fetchViviendas(user.comunidad._id || user.comunidad);
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
          fetchViviendas(primeraId);
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
    fetchViviendas(comunidadId);
  };
  
  const fetchViviendas = async (comunidadId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Si es superadmin y hay comunidad seleccionada, filtrar por ella
      const params = comunidadId ? { comunidad: comunidadId } : {};
      const response = await viviendaService.getAll(params);
      
      if (response.success) {
        setViviendas(response.data);
        // Actualizar la suma de coeficientes
        if (response.sumaCoeficientes !== undefined) {
          setSumaCoeficientes(response.sumaCoeficientes);
          setCoeficienteDisponible((100 - response.sumaCoeficientes).toFixed(2));
        } else {
          // Si el backend no devuelve la suma, calcularla
          const suma = response.data.reduce((sum, vivienda) => sum + vivienda.coeficiente, 0);
          setSumaCoeficientes(parseFloat(suma.toFixed(2)));
          setCoeficienteDisponible((100 - suma).toFixed(2));
        }
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las viviendas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vivienda = null) => {
    if (vivienda) {
      setCurrentVivienda(vivienda);
      setFormData({
        numeroPuerta: vivienda.numeroPuerta || '',
        coeficiente: vivienda.coeficiente || '',
        derechoVoto: vivienda.derechoVoto !== undefined ? vivienda.derechoVoto : true,
        comunidad: vivienda.comunidad?._id || vivienda.comunidad || comunidadSeleccionada
      });
    } else {
      setCurrentVivienda(null);
      setFormData({
        numeroPuerta: '',
        coeficiente: '',
        derechoVoto: true,
        comunidad: comunidadSeleccionada
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentVivienda(null);
    setFormData({
      numeroPuerta: '',
      coeficiente: '',
      derechoVoto: true,
      comunidad: comunidadSeleccionada
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validar datos
      if (!formData.numeroPuerta.trim() || !formData.coeficiente) {
        setError('El número de puerta y coeficiente son obligatorios');
        setLoading(false);
        return;
      }
      
      // Convertir coeficiente a número
      const coeficienteNum = parseFloat(formData.coeficiente);
      if (isNaN(coeficienteNum) || coeficienteNum <= 0) {
        setError('El coeficiente debe ser un número mayor que 0');
        setLoading(false);
        return;
      }
      
      // Validar que no exceda el coeficiente disponible (en caso de nueva vivienda o actualización)
      if (!currentVivienda) {
        // Nueva vivienda - verificar que no exceda el coeficiente disponible
        if (coeficienteNum > parseFloat(coeficienteDisponible)) {
          setError(`El coeficiente excede el valor disponible. Valor máximo disponible: ${coeficienteDisponible}%`);
          setLoading(false);
          return;
        }
      } else {
        // Actualización - verificar que no exceda considerando el valor original
        const disponibleActual = parseFloat(coeficienteDisponible) + currentVivienda.coeficiente;
        if (coeficienteNum > disponibleActual) {
          setError(`El coeficiente excede el valor disponible. Valor máximo disponible: ${disponibleActual.toFixed(2)}%`);
          setLoading(false);
          return;
        }
      }
      
      const viviendaData = {
        ...formData,
        coeficiente: coeficienteNum,
        comunidad: formData.comunidad || comunidadSeleccionada
      };
      
      let response;
      if (currentVivienda) {
        // Actualizar vivienda existente
        response = await viviendaService.update(currentVivienda._id, viviendaData);
      } else {
        // Crear nueva vivienda
        response = await viviendaService.create(viviendaData);
      }
      
      if (response.success) {
        fetchViviendas(comunidadSeleccionada);
        handleCloseModal();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al guardar la vivienda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta vivienda? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await viviendaService.delete(id);
      
      if (response.success) {
        fetchViviendas();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al eliminar la vivienda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && viviendas.length === 0) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando viviendas...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administración de Viviendas</h1>
        <p>Gestiona las viviendas de la comunidad</p>
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
            <option value="">Mostrar todas las viviendas</option>
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
            <div className="stat-value">{viviendas.length}</div>
            <div className="stat-label">Total de viviendas</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{sumaCoeficientes}%</div>
            <div className="stat-label">Suma de coeficientes</div>
          </div>
          <div className="stat-card" style={{ backgroundColor: parseFloat(coeficienteDisponible) < 0 ? 'var(--color-error-bg)' : 'var(--color-success-bg)' }}>
            <div className="stat-value">{coeficienteDisponible}%</div>
            <div className="stat-label">Coeficiente disponible</div>
          </div>
        </div>
        
        <div className="admin-data-container">
          <div className="admin-data-header">
            <h2>Listado de viviendas</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => handleOpenModal()}
              disabled={parseFloat(coeficienteDisponible) <= 0}
              title={parseFloat(coeficienteDisponible) <= 0 ? "No hay coeficiente disponible" : ""}
            >
              Agregar vivienda
            </button>
          </div>
          
          {viviendas.length === 0 ? (
            <p className="empty-message">No hay viviendas registradas.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Número/Puerta</th>
                    <th>Coeficiente</th>
                    <th>Habitantes</th>
                    <th>Derecho a voto</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {viviendas.map(vivienda => (
                    <tr key={vivienda._id}>
                      <td>{vivienda.numeroPuerta || '-'}</td>
                      <td>{vivienda.coeficiente ? `${vivienda.coeficiente}%` : '-'}</td>
                      <td>
                        {vivienda.habitantes && vivienda.habitantes.length > 0 
                          ? vivienda.habitantes.map(h => h.nombre).join(', ') 
                          : 'Sin habitantes'}
                      </td>
                      <td>{vivienda.derechoVoto ? 'Sí' : 'No'}</td>
                      <td className="actions-cell">
                        <button 
                          className="btn-icon edit"
                          onClick={() => handleOpenModal(vivienda)}
                        >
                          <span className="icon">✏️</span>
                        </button>
                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDelete(vivienda._id)}
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
      
      {/* Modal para agregar/editar vivienda */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{currentVivienda ? 'Editar Vivienda' : 'Agregar Vivienda'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="numeroPuerta">Número/Puerta:</label>
                <input
                  type="text"
                  id="numeroPuerta"
                  name="numeroPuerta"
                  value={formData.numeroPuerta}
                  onChange={handleInputChange}
                  placeholder="Ej: 1ºA, 2B, 3C"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="coeficiente">
                  Coeficiente (%):
                  {currentVivienda ? (
                    <span className="coeficiente-info">
                      {` Máximo disponible: ${(parseFloat(coeficienteDisponible) + currentVivienda.coeficiente).toFixed(2)}%`}
                    </span>
                  ) : (
                    <span className="coeficiente-info">
                      {` Máximo disponible: ${coeficienteDisponible}%`}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  id="coeficiente"
                  name="coeficiente"
                  value={formData.coeficiente}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  max={currentVivienda ? 
                    (parseFloat(coeficienteDisponible) + currentVivienda.coeficiente).toFixed(2) : 
                    coeficienteDisponible}
                  placeholder="Ej: 5.75"
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <div className="custom-checkbox" onClick={() => handleInputChange({
                  target: {
                    name: 'derechoVoto',
                    type: 'checkbox',
                    checked: !formData.derechoVoto
                  }
                })}>
                  <input
                    type="checkbox"
                    id="derechoVoto"
                    name="derechoVoto"
                    checked={formData.derechoVoto}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-indicator"></span>
                  <span className="checkbox-text">Derecho a voto</span>
                </div>
              </div>
              {/* Selector de comunidad oculto para superadmin */}
              {esSuperAdmin && (
                <div className="form-group">
                  <label htmlFor="form-comunidad">Comunidad:</label>
                  <select
                    id="form-comunidad"
                    name="comunidad"
                    value={formData.comunidad || comunidadSeleccionada}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona una comunidad</option>
                    {comunidades.map(comunidad => (
                      <option key={comunidad._id} value={comunidad._id}>
                        {comunidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViviendasPage; 