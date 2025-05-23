import { useState, useEffect, useRef } from 'react';
import { votacionService } from '../services/api';

const useVotacionState = (id, user) => {
  const [votacion, setVotacion] = useState(null);
  const [resultados, setResultados] = useState(null);
  const [yaVoto, setYaVoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [votoEmitido, setVotoEmitido] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [iniciandoVotacion, setIniciandoVotacion] = useState(false);
  const [sinVivienda, setSinVivienda] = useState(false);
  const [resultadosCargados, setResultadosCargados] = useState(false);
  
  const timerRef = useRef(null);
  const fetchingResultadosRef = useRef(false);
  const didFinishRef = useRef(false);

  // Determina si una votación debería estar activa basado en las fechas actuales
  const isVotacionActiva = () => {
    if (!votacion) return false;
    
    const now = new Date();
    const fechaInicio = new Date(votacion.fechaInicio);
    const fechaFin = new Date(votacion.fechaFin);
    
    return fechaInicio <= now && now <= fechaFin;
  };
  
  // Determina si una votación debería estar finalizada basado en las fechas actuales (para el estado)
  const isVotacionFinalizada = (votacionData = null) => {
    const votacionToCheck = votacionData || votacion;
    if (!votacionToCheck) return false;
    
    const now = new Date();
    const fechaFin = new Date(votacionToCheck.fechaFin);
    
    return fechaFin < now;
  };
  
  // Determina si una votación debería estar pendiente basado en las fechas actuales
  const isVotacionPendiente = () => {
    if (!votacion) return false;
    
    const now = new Date();
    const fechaInicio = new Date(votacion.fechaInicio);
    
    return now < fechaInicio;
  };
  
  // Estado real basado en fechas y estado almacenado
  const estadoReal = () => {
    if (!votacion) return '';
    
    // Si el estado almacenado es 'finalizada', respetarlo
    if (votacion.estado === 'finalizada') return 'finalizada';
    
    // Si ya pasó la fecha de fin, considerarla finalizada 
    if (isVotacionFinalizada()) return 'finalizada';
    
    // Si ya pasó la fecha de inicio pero no la de fin, considerarla activa
    if (isVotacionActiva()) return 'activa';
    
    // Si aún no ha llegado la fecha de inicio, considerarla pendiente
    return 'pendiente';
  };

  const fetchVotacion = async () => {
    try {
      setLoading(true);
      const response = await votacionService.getById(id);
      
      if (response.success) {
        setVotacion(response.data);
        
        // Verificar si el usuario tiene vivienda asignada o es superadmin/admin
        if (user && (user.rol === 'superadmin' || user.rol === 'admin')) {
          // Para superadmin y admin, verificar directamente si la votación tiene votos
          try {
            const verificacionResponse = await votacionService.verificarVoto(id);
            
            if (verificacionResponse.success) {
              // Si es superadmin o admin, yaVoto indica si hay votos en la votación
              setYaVoto(verificacionResponse.yaVoto);
              setSinVivienda(false);
              
              // Si la votación tiene votos y muestra resultados parciales, cargar resultados
              if (verificacionResponse.yaVoto && response.data.mostrarResultadosParciales && !resultadosCargados) {
                await cargarResultados();
              }
            }
          } catch (err) {
            // Si hay error en la verificación, cargar resultados de todas formas para superadmin/admin
            if (response.data.estado === 'finalizada') {
              await cargarResultados();
            }
          }
        } else if (user && (!user.vivienda || user.vivienda === null)) {
          // Usuario normal sin vivienda
          setSinVivienda(true);
          setYaVoto(false);
        } else {
          // Usuario normal con vivienda
          setSinVivienda(false);
          
          // Verificar directamente si el usuario ya votó usando el nuevo endpoint
          try {
            const verificacionResponse = await votacionService.verificarVoto(id);
            
            if (verificacionResponse.success) {
              const usuarioYaVoto = verificacionResponse.yaVoto;
              setYaVoto(usuarioYaVoto);
              
              // Si el estado votoEmitido es true, significa que el usuario acaba de votar
              // y debemos forzar yaVoto a true incluso si el backend aún no ha actualizado
              if (votoEmitido) {
                setYaVoto(true);
              }
              
              // Si el usuario ya votó y la votación muestra resultados parciales, cargar resultados
              if ((usuarioYaVoto || votoEmitido) && response.data.mostrarResultadosParciales && !resultadosCargados) {
                await cargarResultados();
              }
              
              // Si la votación está finalizada, cargar resultados independientemente de si el usuario ha votado o no
              if (response.data.estado === 'finalizada' || isVotacionFinalizada(response.data) && !resultadosCargados) {
                await cargarResultados();
              }
            } else {
              // Si hay un error en la verificación, intentar el método anterior
              verificarVotoConListaVotos(response.data);
            }
          } catch (err) {
            verificarVotoConListaVotos(response.data);
          }
        }
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al cargar la votación');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cargar resultados de la votación
  const cargarResultados = async () => {
    if (fetchingResultadosRef.current) return;
    
    try {
      fetchingResultadosRef.current = true;
      setLoadingResultados(true);
      
      const resultadosResponse = await votacionService.getResultados(id);
      
      if (resultadosResponse.success) {
        setResultados(resultadosResponse.data);
        setResultadosCargados(true);
      }
    } catch (err) {
      // Error silencioso
    } finally {
      setLoadingResultados(false);
      fetchingResultadosRef.current = false;
    }
  };
  
  // Función auxiliar para verificar si el usuario ya votó usando la lista de votos
  const verificarVotoConListaVotos = (votacionData) => {
    let usuarioYaVoto = false;
    if (votacionData.votos && user) {
      // Buscar si existe un voto donde el usuario actual sea el emisor
      const votoUsuario = votacionData.votos.find(
        voto => {
          // Verificar si el voto tiene la misma vivienda que el usuario actual
          if (user.vivienda && voto.vivienda) {
            return voto.vivienda._id === user.vivienda._id || 
                   voto.vivienda === user.vivienda._id || 
                   voto.vivienda === user.vivienda;
          }
          // Si no hay vivienda, verificar por usuario
          return voto.usuario === user._id || 
                 (voto.usuario && voto.usuario._id === user._id);
        }
      );
      usuarioYaVoto = !!votoUsuario;
      
      // Si el estado votoEmitido es true, significa que el usuario acaba de votar
      if (votoEmitido) {
        usuarioYaVoto = true;
      }
      
      setYaVoto(usuarioYaVoto);
      
      // Si el usuario ya votó y la votación muestra resultados parciales, cargar resultados
      if ((usuarioYaVoto || votoEmitido) && votacionData.mostrarResultadosParciales && !resultadosCargados) {
        cargarResultados();
      }
    }
  };

  const handleVotoEmitido = async (votacionActualizada = null, resultadosParciales = null) => {
    // Si recibimos la votación actualizada del backend, usarla directamente
    if (votacionActualizada) {
      setVotacion(votacionActualizada);
      setYaVoto(true);
      setVotoEmitido(true);
      
      // Si ya recibimos los resultados parciales, usarlos directamente
      if (resultadosParciales && votacionActualizada.mostrarResultadosParciales) {
        setResultados(resultadosParciales);
      } else if (votacionActualizada.mostrarResultadosParciales && !fetchingResultadosRef.current) {
        // Si no recibimos resultados parciales pero deberían mostrarse, cargarlos
        fetchingResultadosRef.current = true;
        setLoadingResultados(true);
        
        try {
          const resultadosResponse = await votacionService.getResultados(id);
          if (resultadosResponse.success) {
            setResultados(resultadosResponse.data);
          }
        } catch (err) {
          // Error silencioso
        } finally {
          setLoadingResultados(false);
          fetchingResultadosRef.current = false;
        }
      }
    } else {
      // Si no recibimos la votación actualizada, simplemente marcar como votado
      // y la votación se recargará en el siguiente ciclo
      setYaVoto(true);
      setVotoEmitido(true);
      
      // Intentar cargar los resultados parciales si corresponde
      if (votacion && votacion.mostrarResultadosParciales && !fetchingResultadosRef.current) {
        fetchingResultadosRef.current = true;
        setLoadingResultados(true);
        
        try {
          const resultadosResponse = await votacionService.getResultados(id);
          if (resultadosResponse.success) {
            setResultados(resultadosResponse.data);
          }
        } catch (err) {
          // Error silencioso
        } finally {
          setLoadingResultados(false);
          fetchingResultadosRef.current = false;
        }
      }
    }
  };

  // Iniciar votación manualmente
  const handleIniciarVotacion = async () => {
    try {
      setIniciandoVotacion(true);
      const response = await votacionService.iniciarVotacion(id);
      
      if (response.success) {
        setVotacion({
          ...votacion,
          estado: 'activa',
          fechaInicio: new Date()
        });
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Error al iniciar la votación');
    } finally {
      setIniciandoVotacion(false);
    }
  };

  const puedeVotar = () => {
    if (!user || !votacion) return false;
    
    // Si el usuario no tiene vivienda asignada, no puede votar
    if (!user.vivienda) return false;
    
    // Debe estar activa según fechas y no haber votado ya
    return estadoReal() === 'activa' && !yaVoto;
  };

  useEffect(() => {
    // Efecto principal para cargar la votación y verificar el estado del usuario
    if (id && user) {
      fetchVotacion();
      
      // Si es superadmin o admin, cargar siempre los resultados
      if ((user.rol === 'superadmin' || user.rol === 'admin') && !resultadosCargados) {
        cargarResultados();
      }
      
      // Si la votación está finalizada, cargar resultados para cualquier usuario
      if (votacion && (votacion.estado === 'finalizada' || isVotacionFinalizada()) && !resultadosCargados) {
        cargarResultados();
      }
      
      // Limpiar el estado de votoEmitido después de cargar la votación
      // Esto evita que se mantenga el estado después de navegar entre votaciones
      if (votoEmitido) {
        const timer = setTimeout(() => {
          setVotoEmitido(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
    
    return () => {
      // Limpiar temporizadores o suscripciones si es necesario
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Reiniciar estados al desmontar el componente
      setResultadosCargados(false);
      setResultados(null);
    };
  }, [id, user, votoEmitido]);
  
  useEffect(() => {
    // Calcular y actualizar el tiempo restante si la votación está activa o debería estarlo
    if (votacion && (votacion.estado === 'activa' || isVotacionActiva())) {
      // Resetear la referencia antes de comenzar
      didFinishRef.current = false;
      
      const calcularTiempoRestante = () => {
        const ahora = new Date();
        const fechaFin = new Date(votacion.fechaFin);
        const diferencia = fechaFin - ahora;
        
        if (diferencia <= 0) {
          // Si el tiempo ha terminado, simplemente limpiar el temporizador
          clearInterval(timerRef.current);
          timerRef.current = null;
          setTiempoRestante(null);
          
          // Solo recargar la votación si no lo hemos hecho ya
          if (!didFinishRef.current) {
            didFinishRef.current = true;
            fetchVotacion();
          }
          return;
        }
        
        // Calcular días, horas, minutos y segundos restantes
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
        
        setTiempoRestante({
          dias,
          horas,
          minutos,
          segundos,
          total: diferencia
        });
      };
      
      // Calcular inmediatamente y luego cada segundo
      calcularTiempoRestante();
      
      // Limpiar timer existente antes de crear uno nuevo
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(calcularTiempoRestante, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    } else if (votacion) {
      // Si hay un temporizador existente y la votación ya no está activa, limpiarlo
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [votacion?.estado, votacion?.fechaFin]);

  return {
    votacion,
    resultados,
    yaVoto,
    loading,
    error,
    loadingResultados,
    votoEmitido,
    tiempoRestante,
    iniciandoVotacion,
    sinVivienda,
    estadoReal,
    puedeVotar,
    handleVotoEmitido,
    handleIniciarVotacion,
    cargarResultados
  };
};

export default useVotacionState; 