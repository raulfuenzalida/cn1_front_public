import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import LoginForm from '../../components/common/LoginForm';

const Profile = ({ initialMode }) => {
  const { isAuthenticated, user, roles, logout, loading } = useAuth();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const modeParam = queryParams.get('mode');

  let defaultMode = initialMode || modeParam;
  if (!defaultMode) {
    if (location.pathname.includes('/register')) defaultMode = 'register';
    else if (location.pathname.includes('/verify')) defaultMode = 'confirm';
    else defaultMode = 'login';
  }

  if (loading) {
    return (
      <div className="container my-5">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="text-center mb-4">
              <span className="badge bg-secondary mb-2">No has iniciado sesión</span>
              <h2 className="h4 mb-2">
                {defaultMode === 'confirm'
                  ? 'Verificación de Cuenta'
                  : defaultMode === 'register'
                  ? 'Registro de Nuevo Cliente'
                  : 'Acceso de Clientes'}
              </h2>
              <p className="text-muted small">
                {defaultMode === 'confirm'
                  ? 'Ingresa el código de 6 dígitos que llegó a tu correo para activar tu cuenta de cliente.'
                  : defaultMode === 'register'
                  ? 'Crea tu cuenta con tu correo y contraseña para comprar en PrintWorks.'
                  : 'Inicia sesión con tu correo electrónico registrado para acceder a tu perfil y completar tus pedidos.'}
              </p>
            </div>

            <LoginForm
              defaultMode={defaultMode}
              title="Iniciar Sesión"
              subtitle="Autenticación con correo electrónico"
            />

            <div className="text-center mt-4">
              <Link to="/catalog" className="text-decoration-none">
                ← Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow-sm profile-card">
            <div className="card-header bg-transparent border-bottom py-3 d-flex justify-content-between align-items-center">
              <h2 className="h4 mb-0">Perfil de Usuario</h2>
              <span className="badge bg-success">Conectado</span>
            </div>

            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="h5 mb-1">{user?.email || 'Usuario'}</h3>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    ● Conectado
                  </span>
                </div>
              </div>

              <hr />

              <div className="mb-4">
                <h4 className="h6 text-muted text-uppercase mb-3">Información de la Cuenta</h4>
                <div className="list-group list-group-flush">
                  <div className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Correo Electrónico</span>
                    <span className="fw-semibold">{user?.email || '-'}</span>
                  </div>
                  <div className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center">
                    <span className="text-muted">Estado</span>
                    <span className="badge bg-success">Conectado</span>
                  </div>
                  {roles && roles.length > 0 && (
                    <div className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center">
                      <span className="text-muted">Rol</span>
                      <span className="fw-semibold">{roles.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 justify-content-between pt-3 border-top">
                <div className="d-flex gap-2">
                  <Link to="/cart" className="btn btn-outline-primary">
                    Ir al Carrito
                  </Link>
                  <Link to="/catalog" className="btn btn-outline-secondary">
                    Ir al Catálogo
                  </Link>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={logout}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
