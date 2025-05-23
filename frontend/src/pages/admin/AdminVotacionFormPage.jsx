import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { votacionService, comunidadService } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './AdminVotacionForm.css';

const AdminVotacionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isEditing = !!id;
  const esSuperAdmin = user && user.rol === 'superadmin';
  
  const [comunidades, setComunidades] = useState([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipoMayoria: 'simple',
    sistemaRecuento: 'vivienda',
    opciones: [{ texto: '' }, { texto: '' }],
    mostrarResultadosParciales: true,
    comunidad: ''
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Si es superadmin, cargar las comunidades
    if (esSuperAdmin) {
      fetchComunidades();
    } else if (user && user.comunidad) {
      // Si es admin normal, usar su comunidad
      setFormData(prev => ({
        ...prev,
        comunidad: user.comunidad._id || user.comunidad
      }));
    }
    
    // Si estamos editando, cargar los datos de la votación
    if (isEditing) {
      fetchVotacion();
    }
  }, [id, isEditing, esSuperAdmin, user]);
  
  const fetchComunidades = async () => {
    try {
      const response = await comunidadService.getAll();
      
      if (response.success) {
        setComunidades(response.data);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar las comunidades');
    }
  };
  
  const fetchVotacion = async () => {
    try {
      setLoading(true);
      const response = await votacionService.getById(id);
      
      if (response.success) {
        // Formatear fechas para el input type="datetime-local"
        const fechaInicio = new Date(response.data.fechaInicio);
        const fechaFin = new Date(response.data.fechaFin);
        
        const formatDate = (date) => {
          const pad = (num) => (num < 10 ? '0' + num : num);
          
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };
        
        setFormData({
          ...response.data,
          fechaInicio: formatDate(fechaInicio),
          fechaFin: formatDate(fechaFin),
          tipoMayoria: response.data.tipoMayoria || 'simple',
          sistemaRecuento: response.data.sistemaRecuento || 'vivienda',
          opciones: response.data.opciones?.length > 0 
            ? response.data.opciones 
            : [{ texto: '' }, { texto: '' }],
          comunidad: response.data.comunidad?._id || response.data.comunidad || ''
        });
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar la votación');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleOpcionChange = (index, value) => {
    const newOpciones = [...formData.opciones];
    newOpciones[index] = { ...newOpciones[index], texto: value };
    
    setFormData(prev => ({
      ...prev,
      opciones: newOpciones
    }));
  };
  
  const addOpcion = () => {
    setFormData(prev => ({
      ...prev,
      opciones: [...prev.opciones, { texto: '' }]
    }));
  };
  
  const removeOpcion = (index) => {
    if (formData.opciones.length <= 2) {
      setError('La votación debe tener al menos 2 opciones');
      return;
    }
    
    const newOpciones = formData.opciones.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      opciones: newOpciones
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    const opcionesValidas = formData.opciones.filter(op => op.texto.trim() !== '');
    if (opcionesValidas.length < 2) {
      setError('Debes añadir al menos 2 opciones válidas');
      return;
    }
    
    const fechaInicioLocal = new Date(formData.fechaInicio);
    const fechaFinLocal = new Date(formData.fechaFin);
    
    // Convertir fechas locales a UTC ISO string (sin restar offset manualmente)
    const fechaInicioUTC = new Date(formData.fechaInicio).toISOString();
    const fechaFinUTC = new Date(formData.fechaFin).toISOString();
    
    if (fechaFinLocal <= fechaInicioLocal) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }
    
    // Verificar que se ha seleccionado una comunidad (para superadmin)
    if (esSuperAdmin && !formData.comunidad) {
      setError('Debes seleccionar una comunidad');
      return;
    }

    // Obtener el ID de la comunidad del usuario de forma segura
    let comunidadId;
    if (esSuperAdmin) {
      comunidadId = formData.comunidad;
    } else {
      // Para usuarios normales, asegurarse de extraer correctamente el ID de la comunidad
      if (user.comunidad) {
        comunidadId = typeof user.comunidad === 'object' && user.comunidad._id 
          ? user.comunidad._id 
          : user.comunidad;
      } else {
        setError('No tienes una comunidad asignada para crear votaciones');
        return;
      }
    }
    
    // Preparar datos para enviar
    const votacionData = {
      ...formData,
      fechaInicio: fechaInicioUTC,
      fechaFin: fechaFinUTC,
      opciones: formData.opciones.filter(op => op.texto.trim() !== ''),
      comunidad: comunidadId
    };
    
    try {
      setSubmitting(true);
      setError(null);
      
      let response;
      
      if (isEditing) {
        response = await votacionService.update(id, votacionData);
      } else {
        response = await votacionService.create(votacionData);
      }
      
      if (response.success) {
        navigate(config.ROUTES.ADMIN.VOTACIONES);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : `Error al ${isEditing ? 'actualizar' : 'crear'} la votación`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const configurarTiempoVotacion = (minutos) => {
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + minutos * 60000);
    
    const formatDate = (date) => {
      const pad = (num) => (num < 10 ? '0' + num : num);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    
    setFormData(prev => ({
      ...prev,
      fechaInicio: formatDate(ahora),
      fechaFin: formatDate(fin)
    }));
  };
  
  // Función para configurar opciones predefinidas de votación
  const configurarOpciones = (tipo) => {
    let nuevasOpciones = [];
    
    switch (tipo) {
      case 'afavor_encontra_abstencion':
        nuevasOpciones = [
          { texto: 'A favor' },
          { texto: 'En contra' },
          { texto: 'Abstención' }
        ];
        break;
      case 'si_no_abstencion':
        nuevasOpciones = [
          { texto: 'Sí' },
          { texto: 'No' },
          { texto: 'Abstención' }
        ];
        break;
      default:
        return;
    }
    
    setFormData(prev => ({
      ...prev,
      opciones: nuevasOpciones
    }));
  };
  
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Cargando formulario...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{isEditing ? 'Editar Votación' : 'Nueva Votación'}</h1>
        <p>{isEditing ? 'Modifica los detalles de la votación' : 'Crea una nueva votación en la comunidad'}</p>
      </div>
      
      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}
      
      <div className="admin-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-section">
              <h2>Información básica</h2>
              
              {/* Selector de comunidad para superadmin */}
              {esSuperAdmin && (
                <div className="form-group">
                  <label htmlFor="comunidad">Comunidad*</label>
                  <select
                    id="comunidad"
                    name="comunidad"
                    value={formData.comunidad}
                    onChange={handleChange}
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
              
              <div className="form-group">
                <label htmlFor="titulo">Título*</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  placeholder="Título de la votación"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="descripcion">Descripción*</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  placeholder="Describe detalladamente el propósito de la votación"
                  rows={4}
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Fechas</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fechaInicio">Fecha de inicio*</label>
                  <input
                    type="datetime-local"
                    id="fechaInicio"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="fechaFin">Fecha de fin*</label>
                  <input
                    type="datetime-local"
                    id="fechaFin"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="votacion-rapida">
                <h3>Configuración rápida para reuniones</h3>
                <div className="botones-tiempo">
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarTiempoVotacion(1)}
                  >
                    1 minuto
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarTiempoVotacion(2)}
                  >
                    2 minutos
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarTiempoVotacion(5)}
                  >
                    5 minutos
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarTiempoVotacion(10)}
                  >
                    10 minutos
                  </button>
                </div>
                <p className="tip">Estos botones configuran una votación que inicia ahora y finaliza en el tiempo seleccionado</p>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Sistema de votación</h2>
              
              <div className="form-group">
                <label htmlFor="tipoMayoria">Tipo de mayoría*</label>
                <select
                  id="tipoMayoria"
                  name="tipoMayoria"
                  value={formData.tipoMayoria}
                  onChange={handleChange}
                  required
                >
                  <option value="simple">Mayoría simple</option>
                  <option value="tres_quintos">Tres quintos (3/5)</option>
                  <option value="unanimidad">Unanimidad</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="sistemaRecuento">Sistema de recuento*</label>
                <select
                  id="sistemaRecuento"
                  name="sistemaRecuento"
                  value={formData.sistemaRecuento}
                  onChange={handleChange}
                  required
                >
                  <option value="vivienda">Por vivienda (1 vivienda = 1 voto)</option>
                  <option value="coeficiente">Por coeficiente (según % de participación)</option>
                </select>
                <small className="form-text">
                  El sistema de recuento determina cómo se contabilizarán los votos para esta votación.
                </small>
              </div>
              
              <div className="form-group checkbox-group">
                <div className="custom-checkbox" onClick={() => handleChange({
                  target: {
                    name: 'mostrarResultadosParciales',
                    type: 'checkbox',
                    checked: !formData.mostrarResultadosParciales
                  }
                })}>
                <input
                  type="checkbox"
                  id="mostrarResultadosParciales"
                  name="mostrarResultadosParciales"
                  checked={formData.mostrarResultadosParciales}
                  onChange={handleChange}
                />
                  <span className="checkbox-indicator"></span>
                  <span className="checkbox-text">Mostrar resultados parciales a los participantes</span>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <h2>Opciones de votación</h2>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={addOpcion}
                >
                  + Añadir opción
                </button>
              </div>
              
              <div className="votacion-rapida opciones-predefinidas">
                <h3>Configuración rápida de opciones</h3>
                <div className="botones-tiempo botones-opciones">
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarOpciones('afavor_encontra_abstencion')}
                  >
                    A favor / En contra / Abstención
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => configurarOpciones('si_no_abstencion')}
                  >
                    Sí / No / Abstención
                  </button>
                </div>
                <p className="tip">Estos botones configuran rápidamente las opciones más comunes para votaciones</p>
              </div>
              
              {formData.opciones.map((opcion, index) => (
                <div key={index} className="opcion-form-item">
                  <div className="form-group">
                    <label htmlFor={`opcion-${index}`}>Opción {index + 1}*</label>
                    <div className="opcion-input-group">
                      <input
                        type="text"
                        id={`opcion-${index}`}
                        value={opcion.texto}
                        onChange={(e) => handleOpcionChange(index, e.target.value)}
                        required={index < 2}
                        placeholder="Texto de la opción"
                      />
                      <button 
                        type="button" 
                        className="btn-icon delete"
                        onClick={() => removeOpcion(index)}
                        title="Eliminar opción"
                      >
                        <span className="icon">🗑️</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-text"
                onClick={() => navigate(config.ROUTES.ADMIN.VOTACIONES)}
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting 
                  ? (isEditing ? 'Guardando...' : 'Creando...') 
                  : (isEditing ? 'Guardar cambios' : 'Crear votación')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminVotacionFormPage; 