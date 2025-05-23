import { Link } from 'react-router-dom';
import config from '../utils/config';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
        <Link to={config.ROUTES.HOME} className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
      <div className="not-found-image">
        <div className="error-illustration">
          <div className="magnifying-glass"></div>
          <div className="question-mark"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 