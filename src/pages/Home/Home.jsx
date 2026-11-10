import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/products/ProductCard';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getProducts({ page: 0, size: 3 });
        setProducts(response.content || []);
      } catch (err) {
        setError('No se pudieron cargar los productos destacados.');
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Bienvenido a PrintWorks</h1>
          <p>Tu tienda de impresión 3D de confianza</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/catalog" className="btn btn-light btn-lg">
              Ver catálogo
            </Link>
            <Link to="/profile" className="btn btn-outline-light btn-lg">
              Iniciar Sesión / Mi Perfil
            </Link>
          </div>
        </div>
      </section>

      <section className="container my-5">
        <h2 className="text-center mb-4">Productos Destacados</h2>
        
        {loading && (
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-warning text-center my-4 p-4 shadow-sm rounded" role="alert">
            <h3 className="h5 mb-2">Microservicio de Productos no disponible (502)</h3>
            <p className="text-muted small mb-2">{error}</p>
            <p className="text-muted small mb-3">
              El microservicio <code>ms_products</code> no está respondiendo en el puerto <code>8081</code>.
              Aun así, puedes navegar a tu perfil, iniciar sesión o registrarte.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <Link to="/catalog" className="btn btn-outline-secondary btn-sm">
                Ir al catálogo
              </Link>
              <Link to="/profile" className="btn btn-primary btn-sm">
                Ir a Mi Perfil / Iniciar Sesión
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <p>No hay productos disponibles en este momento.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {products.map((product) => (
              <div key={product.id} className="col">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/catalog" className="btn btn-outline-primary">
            Ver todo el catálogo
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
