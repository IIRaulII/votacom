import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import ScrollToTop from './components/utils/ScrollToTop';

// Páginas principales
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Páginas de votaciones
import VotacionesPage from './pages/votaciones/VotacionesPage';
import VotacionDetailPage from './pages/votaciones/VotacionDetailPage';

// Páginas de actas
import ActasPage from './pages/actas/ActasPage';

// Páginas de facturas
import FacturasPage from './pages/facturas/FacturasPage';

// Páginas de administración
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminViviendasPage from './pages/admin/AdminViviendasPage';
import AdminVotacionesPage from './pages/admin/AdminVotacionesPage';
import AdminVotacionFormPage from './pages/admin/AdminVotacionFormPage';
import AdminComunidadesPage from './pages/admin/AdminComunidadesPage';
import AdminActaFormPage from './pages/admin/AdminActaFormPage';
import AdminFacturaFormPage from './pages/admin/AdminFacturaFormPage';

// Páginas de comunidades
import SeleccionarComunidadPage from './pages/comunidades/SeleccionarComunidadPage';
import UnirseComunidadPage from './pages/comunidades/UnirseComunidadPage';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* Rutas públicas dentro del layout principal */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
            
            {/* Rutas protegidas para usuarios autenticados */}
            <Route element={<ProtectedRoute />}>
              <Route path="seleccionar-comunidad" element={<SeleccionarComunidadPage />} />
              <Route path="unirse-comunidad" element={<UnirseComunidadPage />} />
              
              {/* Rutas que requieren pertenencia a una comunidad */}
              <Route path="votaciones" element={<VotacionesPage />} />
              <Route path="votaciones/:id" element={<VotacionDetailPage />} />
              <Route path="actas" element={<ActasPage />} />
              <Route path="facturas" element={<FacturasPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="perfil" element={<ProfilePage />} />
            </Route>
            
            {/* Rutas protegidas para administradores */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="admin/usuarios" element={<AdminUsuariosPage />} />
              <Route path="admin/viviendas" element={<AdminViviendasPage />} />
              <Route path="admin/votaciones" element={<AdminVotacionesPage />} />
              <Route path="admin/votaciones/nueva" element={<AdminVotacionFormPage />} />
              <Route path="admin/votaciones/:id/editar" element={<AdminVotacionFormPage />} />
              <Route path="admin/actas/nueva" element={<AdminActaFormPage />} />
              <Route path="admin/facturas/nueva" element={<AdminFacturaFormPage />} />
            </Route>
            
            {/* Rutas protegidas para superadministradores */}
            <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
              <Route path="admin/comunidades" element={<AdminComunidadesPage />} />
            </Route>
            
            {/* Página no encontrada */}
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
