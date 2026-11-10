import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/formatUtils';
import { useCart } from '../../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);

  let addToCart = () => {};
  try {
    const cart = useCart();
    if (cart?.addToCart) {
      addToCart = cart.addToCart;
    }
  } catch {
    // Fallback si se renderiza fuera de CartProvider
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getProductById(id);
        setProduct(response);
      } catch (err) {
        setError('No se pudo cargar el producto.');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container my-5">
        <div className="error-message">
          {error || 'Producto no encontrado.'}
        </div>
        <Link to="/catalog" className="btn btn-primary mt-3">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const { name, description, finalPrice, tags, images } = product;
  const displayImage = images && images.length > 0 ? images[0] : null;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'flex';
  };

  return (
    <div className="container my-5">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Inicio</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/catalog">Catálogo</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {name}
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-6 mb-4">
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt={name}
                className="img-fluid rounded"
                style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                onError={handleImageError}
              />
              <div
                className="d-flex align-items-center justify-content-center rounded image-placeholder"
                style={{
                  height: '500px',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-primary)',
                  display: 'none',
                }}
              >
                <div className="placeholder-content">
                  <div className="placeholder-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <span className="placeholder-text">Sin imagen</span>
                </div>
              </div>
            </>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center rounded image-placeholder"
              style={{
                height: '500px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-primary)',
              }}
            >
              <div className="placeholder-content">
                <div className="placeholder-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <span className="placeholder-text">Sin imagen</span>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-6">
          <h1 className="mb-3">{name}</h1>
          <p className="price mb-4">{formatPrice(finalPrice)}</p>
          
          <div className="mb-4">
            {tags && tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-4">
            <h4>Descripción</h4>
            <p className="text-muted">{description}</p>
          </div>

          {/* Selector de cantidad y adición al carrito */}
          <div className="card p-3 mb-4 cart-action-card">
            <div className="d-flex align-items-center gap-3 mb-3">
              <label htmlFor="detail-quantity" className="form-label mb-0 fw-semibold">
                Cantidad:
              </label>
              <div className="d-flex align-items-center quantity-control">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <input
                  id="detail-quantity"
                  type="number"
                  min="1"
                  className="form-control form-control-sm text-center mx-2"
                  style={{ width: '60px' }}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  aria-label="Cantidad seleccionada"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityChange(1)}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary flex-grow-1"
                onClick={handleAddToCart}
              >
                Agregar al carrito
              </button>
              <Link to="/cart" className="btn btn-outline-primary">
                Ver carrito
              </Link>
            </div>

            {addedMessage && (
              <div className="alert alert-success mt-3 mb-0 py-2" role="status">
                ✓ {quantity} {quantity === 1 ? 'producto agregado' : 'productos agregados'} al carrito.
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <Link to="/catalog" className="btn btn-outline-secondary">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
