import { Link } from 'react-router-dom';
import config from '../../utils/config';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="footer-logo-container">
            <img src="/favicom.png" alt="VotaCom Logo" className="footer-logo-img" />
            <Link to={config.ROUTES.HOME} className="footer-logo">
              VotaCom
            </Link>
          </div>
          <p className="footer-tagline">
            Sistema de votaciones para comunidades de vecinos con votaciones en tiempo real para acelerar los tiempos de toma de decisiones durante las reuniones de la junta de vecinos.
          </p>
          
          <div className="footer-social">
            <a href="#" className="social-link" aria-label="Facebook">
              <img src="/facebook.png" alt="Facebook" className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="Instagram">
              <img src="/instagram.png" alt="Instagram" className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="WhatsApp">
              <img src="/whatsapp.png" alt="WhatsApp" className="social-icon" />
            </a>
            <a href="#" className="social-link" aria-label="YouTube">
              <img src="/youtube.png" alt="YouTube" className="social-icon" />
            </a>
          </div>
        </div>
        
        <div className="footer-links">
          <div className="footer-section">
            <h4 className="footer-heading">Enlaces</h4>
            <ul className="footer-nav">
              <li>
                <Link to={config.ROUTES.HOME}>Inicio</Link>
              </li>
              <li>
                <Link to={config.ROUTES.VOTACIONES}>Votaciones</Link>
              </li>
              <li>
                <Link to={config.ROUTES.LOGIN}>Iniciar sesión</Link>
              </li>
              <li>
                <Link to={config.ROUTES.REGISTER}>Registro</Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Contacto</h4>
            <address className="footer-contact">
              <p>C/ Santa Marta, 2</p>
              <p>04720 Almería</p>
              <p>info@votacom.es</p>
              <p>+34 608 131 318</p>
            </address>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p className="footer-copyright">
            &copy; {currentYear} VotaCom. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 