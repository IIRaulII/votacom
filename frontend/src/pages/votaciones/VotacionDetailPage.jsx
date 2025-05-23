import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import EmitirVotoForm from '../../components/votaciones/EmitirVotoForm';
import InformeParticipacion from '../../components/votaciones/InformeParticipacion';
import VotacionHeader from '../../components/votaciones/VotacionHeader';
import VotacionInfo from '../../components/votaciones/VotacionInfo';
import VotacionEstadoMessage from '../../components/votaciones/VotacionEstadoMessage';
import VotacionResultados from '../../components/votaciones/VotacionResultados';
import VotacionAdminControls from '../../components/votaciones/VotacionAdminControls';
import LoadingError from '../../components/votaciones/LoadingError';
import useVotacionState from '../../hooks/useVotacionState';
import './VotacionDetailPage.css';

const VotacionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthContext();
  const [mostrarInforme, setMostrarInforme] = useState(false);
  
  const {
    votacion,
    resultados,
    yaVoto,
    loading,
    error,
    loadingResultados,
    tiempoRestante,
    iniciandoVotacion,
    sinVivienda,
    estadoReal,
    puedeVotar,
    handleVotoEmitido,
    handleIniciarVotacion
  } = useVotacionState(id, user);
  
  if (loading || error || !votacion) {
    return <LoadingError loading={loading} error={error} notFound={!loading && !error && !votacion} />;
  }
  
  // Estado real a mostrar en la interfaz
  const estado = estadoReal();
  
  return (
    <div className="votacion-detail-page">
      <VotacionHeader 
        votacion={votacion} 
        estado={estado} 
        tiempoRestante={tiempoRestante} 
      />
      
      <div className="votacion-detail-content">
        <VotacionInfo 
          votacion={votacion} 
          resultados={resultados} 
          estado={estado} 
        />
        
        {puedeVotar() && (
          <div className="votacion-emitir-voto-section">
            <h2>Emitir voto</h2>
            <EmitirVotoForm 
              votacion={votacion} 
              onVotoEmitido={handleVotoEmitido}
            />
          </div>
        )}
        
        {sinVivienda && estado === 'activa' && (
          <VotacionEstadoMessage tipo="sin-vivienda" />
        )}
        
        {yaVoto && estado === 'activa' && (
          <VotacionEstadoMessage tipo="ya-voto" votacion={votacion} />
        )}
        
        {/* Mostrar resultados de la votación */}
        {estado === 'finalizada' ? (
          <VotacionResultados 
            estado={estado}
            loadingResultados={loadingResultados}
            resultados={resultados}
            votacion={votacion}
          />
        ) : (user?.rol === 'superadmin' || user?.rol === 'admin' || (yaVoto && votacion.mostrarResultadosParciales && resultados)) && (
          <VotacionResultados 
            estado={estado}
            loadingResultados={loadingResultados}
            resultados={resultados}
            votacion={votacion}
          />
        )}
        
        {estado === 'pendiente' && (
          <VotacionEstadoMessage tipo="pendiente" votacion={votacion} />
        )}
        
        <VotacionAdminControls
          user={user}
          votacion={votacion}
          estado={estado}
          iniciandoVotacion={iniciandoVotacion}
          handleIniciarVotacion={handleIniciarVotacion}
          mostrarInforme={mostrarInforme}
          setMostrarInforme={setMostrarInforme}
        />
        
        {/* Informe de participación (solo para administradores) */}
        {mostrarInforme && user && (user.rol === 'admin' || user.rol === 'superadmin') && estado === 'finalizada' && (
              <InformeParticipacion votacionId={id} />
        )}
      </div>
    </div>
  );
};

export default VotacionDetailPage; 