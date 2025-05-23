import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import config from '../../utils/config';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate(config.ROUTES.HOME);
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to={config.ROUTES.HOME} className="navbar-logo">
          VotaCom
        </Link>

        <button 
          className="navbar-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="navbar-toggle-icon"></span>
        </button>

        <nav className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li className="navbar-item">
              <NavLink 
                to={config.ROUTES.HOME} 
                className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </NavLink>
            </li>
            
            {/* Enlaces para usuarios autenticados */}
            {isAuthenticated && (
              <>
                <li className="navbar-item">
                  <NavLink 
                    to={config.ROUTES.VOTACIONES} 
                    className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Votaciones
                  </NavLink>
                </li>
                
                <li className="navbar-item">
                  <NavLink 
                    to={config.ROUTES.ACTAS} 
                    className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Actas
                  </NavLink>
                </li>
                
                <li className="navbar-item">
                  <NavLink 
                    to={config.ROUTES.DASHBOARD} 
                    className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                </li>
                
                {/* Enlaces para administradores y superadministradores */}
                {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
                  <>
                    <li className="navbar-item dropdown">
                      <button className="navbar-link dropdown-toggle">
                        Administración
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <NavLink 
                            to={config.ROUTES.ADMIN.USUARIOS} 
                            className="dropdown-item"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Usuarios
                          </NavLink>
                        </li>
                        <li>
                          <NavLink 
                            to={config.ROUTES.ADMIN.VIVIENDAS} 
                            className="dropdown-item"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Viviendas
                          </NavLink>
                        </li>
                        <li>
                          <NavLink 
                            to={config.ROUTES.ADMIN.VOTACIONES} 
                            className="dropdown-item"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Gestión de Votaciones
                          </NavLink>
                        </li>
                        {/* Enlace solo para superadmin */}
                        {user?.rol === 'superadmin' && (
                          <li>
                            <NavLink 
                              to={config.ROUTES.ADMIN.COMUNIDADES} 
                              className="dropdown-item"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Comunidades
                            </NavLink>
                          </li>
                        )}
                      </ul>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          <div className="navbar-auth">
            {isAuthenticated ? (
              <>
                <NavLink 
                  to={config.ROUTES.PERFIL} 
                  className="navbar-user"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.nombre || 'Mi perfil'}
                </NavLink>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-danger navbar-logout"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink 
                  to={config.ROUTES.LOGIN} 
                  className="btn btn-primary navbar-login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Iniciar sesión
                </NavLink>
                <NavLink 
                  to={config.ROUTES.REGISTER} 
                  className="btn navbar-register"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registro
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar; 