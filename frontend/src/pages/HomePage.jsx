import { Link } from 'react-router-dom';
import config from '../utils/config';
import { useAuthContext } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated, user } = useAuthContext();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          {isAuthenticated ? (
            <>
              <h1>Bienvenido, {user?.nombre || 'Usuario'}</h1>
              <p className="hero-text">
                Accede a las votaciones de tu comunidad y participa en la toma de decisiones.
              </p>
              <div className="hero-buttons">
                <Link to={config.ROUTES.VOTACIONES} className="btn btn-primary">
                  Ver votaciones
                </Link>
                <Link to={config.ROUTES.DASHBOARD} className="btn btn-secondary">
                  Mi dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>Simplifica las votaciones en tu comunidad</h1>
              <p className="hero-text">
                VotaCom es la plataforma que facilita la toma de decisiones en comunidades de vecinos,
                permitiendo votaciones transparentes y accesibles para todos.
              </p>
              <div className="hero-buttons">
                <Link to={config.ROUTES.REGISTER} className="btn btn-primary">
                  Registrarse
                </Link>
                <Link to={config.ROUTES.LOGIN} className="btn btn-secondary">
                  Iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="hero-image">
          <img
            src="/heroimage.png"
            alt="Votación en comunidad"
            className="hero-image-img"
          />
        </div>
      </section>

      {!isAuthenticated && (
        <>
          <section className="features section">
            <h2 className="section-title">¿Por qué elegir VotaCom?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <img src="/votaseguro.png" alt="Votaciones seguras" className="feature-icon" />
                <h3>Votaciones seguras</h3>
                <p>Sistema de votación protegido y auditable que garantiza la integridad de cada voto.</p>
              </div>
              <div className="feature-card">
                <img src="/facil.png" alt="Fácil de usar" className="feature-icon" />
                <h3>Fácil y rápido de usar</h3>
                <p>Interfaz intuitiva diseñada para que cualquier vecino pueda participar sin complicaciones.</p>
              </div>
              <div className="feature-card">
                <img src="/resultados.png" alt="Resultados transparentes" className="feature-icon" />
                <h3>Resultados transparentes</h3>
                <p>Visualización clara de los resultados con estadísticas detalladas.</p>
              </div>
              <div className="feature-card">
                <img src="/accesible.png" alt="Accesible 24/7" className="feature-icon" />
                <h3>Accesible 24/7</h3>
                <p>Accede y vota desde cualquier dispositivo, en cualquier momento y lugar.</p>
              </div>
            </div>
          </section>

          <section className="how-it-works section">
            <h2 className="section-title">Cómo funciona</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Registro</h3>
                <p>Registrate en la plataforma y crea tu cuenta.</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Creación de votaciones</h3>
                <p>Se crean votaciones con múltiples opciones y fechas de inicio y fin.</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Participación</h3>
                <p>Los vecinos consultan las votaciones y emiten sus votos de forma segura.</p>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <h3>Resultados</h3>
                <p>Al finalizar, se publican los resultados con estadísticas detalladas.</p>
              </div>
            </div>
          </section>

          <section className="cta section">
            <div className="cta-content">
              <h2>¿Listo para mejorar la participación en tu comunidad?</h2>
              <p>Comienza a utilizar VotaCom hoy mismo y simplifica la toma de decisiones.</p>
              <Link to={config.ROUTES.REGISTER} className="btn-primaryh">
                Comenzar ahora
              </Link>
            </div>
          </section>
        </>
      )}

      {isAuthenticated && (
        <section className="user-dashboard-preview section">
          <h2 className="section-title">Acceso rápido</h2>
          <div className="dashboard-cards">
            <Link to={config.ROUTES.VOTACIONES} className="dashboard-card">
              <h3>Votaciones activas</h3>
              <p>Consulta y participa en las votaciones abiertas de tu comunidad</p>
            </Link>
            <Link to={config.ROUTES.DASHBOARD} className="dashboard-card">
              <h3>Mi dashboard</h3>
              <p>Accede a tu panel personal con resumen de actividad</p>
            </Link>
            <Link to={config.ROUTES.PERFIL} className="dashboard-card">
              <h3>Mi perfil</h3>
              <p>Gestiona tu información personal y preferencias</p>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage; 