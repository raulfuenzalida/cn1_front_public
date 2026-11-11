import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          PrintWorks
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/catalog">
                Catálogo
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Acceso al Carrito */}
            <Link
              to="/cart"
              className="nav-link d-flex align-items-center position-relative cart-nav-btn"
              aria-label={`Carrito de compras, ${totalItems} productos`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="ms-1 d-none d-sm-inline">Carrito</span>
              {totalItems > 0 && (
                <span className="badge rounded-pill cart-badge ms-1" data-testid="cart-badge">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Acceso a Perfil / Login */}
            <Link
              to="/profile"
              className="nav-link d-flex align-items-center profile-nav-btn"
              aria-label={isAuthenticated ? `Perfil de ${user?.email || user?.name}` : 'Iniciar sesión'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="me-1"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="profile-name text-truncate" style={{ maxWidth: '140px' }}>
                {isAuthenticated ? (user?.email?.split('@')[0] || user?.name || 'Mi Perfil') : 'Iniciar sesión'}
              </span>
            </Link>

            {/* Alternador de tema */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '○' : '●'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
