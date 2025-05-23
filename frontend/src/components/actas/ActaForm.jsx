import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { comunidadService } from '../../services/api';
import './ActaForm.css';

const ActaForm = ({ onSubmit }) => {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    comunidad: '',
  });
  const [archivo, setArchivo] = useState(null);
  const [comunidades, setComunidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const esSuperAdmin = user && user.rol === 'superadmin';
  
  useEffect(() => {
    // Si el usuario es admin normal, usar su comunidad directamente
    if (user && user.comunidad && !esSuperAdmin) {
      setFormData(prev => ({
        ...prev,
        comunidad: typeof user.comunidad === 'object' ? user.comunidad._id : user.comunidad
      }));
    } else if (esSuperAdmin) {
      // Si es superadmin, cargar lista de comunidades
      fetchComunidades();
    }
  }, [user, esSuperAdmin]);
  
  const fetchComunidades = async () => {
    try {
      setLoading(true);
      const response = await comunidadService.getAll();
      if (response.success) {
        setComunidades(response.data);
      }
    } catch (err) {
      setError('Error al cargar las comunidades');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar que sea un PDF
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        e.target.value = null;
        return;
      }
      
      // Verificar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no puede superar los 5MB');
        e.target.value = null;
        return;
      }
      
      setArchivo(file);
      setError(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      return;
    }
    
    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (!formData.comunidad) {
      setError('Debes seleccionar una comunidad');
      return;
    }
    
    if (!archivo) {
      setError('Debes subir un archivo PDF');
      return;
    }
    
    try {
      setLoading(true);
      
      // Crear FormData para enviar el archivo
      const data = new FormData();
      data.append('titulo', formData.titulo);
      data.append('fecha', formData.fecha);
      data.append('descripcion', formData.descripcion);
      data.append('comunidad', formData.comunidad);
      data.append('archivo', archivo);
      
      await onSubmit(data);
      
      // Resetear formulario
      setFormData({
        titulo: '',
        fecha: '',
        descripcion: '',
        comunidad: esSuperAdmin ? '' : formData.comunidad
      });
      setArchivo(null);
      
      // Resetear input de archivo
      const fileInput = document.getElementById('archivo');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al crear el acta');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="acta-form-container">
      <h2>Subir nueva acta</h2>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      <form className="acta-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="titulo">Título *</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Título del acta"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fecha">Fecha de la reunión *</label>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="descripcion">Descripción *</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Breve descripción del contenido del acta"
            rows="4"
            required
          ></textarea>
        </div>
        
        {esSuperAdmin && (
          <div className="form-group">
            <label htmlFor="comunidad">Comunidad *</label>
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
          <label htmlFor="archivo">Archivo PDF *</label>
          <input
            type="file"
            id="archivo"
            name="archivo"
            accept="application/pdf"
            onChange={handleFileChange}
            required
          />
          <small>Máximo 5MB. Solo archivos PDF.</small>
        </div>
        
        <button 
          type="submit" 
          className="btn-submit" 
          disabled={loading}
        >
          {loading ? 'Subiendo...' : 'Subir acta'}
        </button>
      </form>
    </div>
  );
};

export default ActaForm; 