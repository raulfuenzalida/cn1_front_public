import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container my-5 text-center">
      <h1 className="display-1">404</h1>
      <h2 className="mb-4">Página no encontrada</h2>
      <p className="mb-4">La página que buscas no existe o ha sido movida.</p>
      <Link to="/" className="btn btn-primary">
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFound;
