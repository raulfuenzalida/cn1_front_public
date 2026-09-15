import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h5>PrintWorks</h5>
            <p>Tu tienda de impresión 3D de confianza.</p>
          </div>
          <div className="col-md-4">
            <h5>Enlaces</h5>
            <ul className="list-unstyled">
              <li><Link to="/catalog">Catálogo</Link></li>
              <li><Link to="/">Inicio</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Contacto</h5>
            <p>info@printworks.cl</p>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-md-12 text-center">
            <p>&copy; 2026 PrintWorks. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
