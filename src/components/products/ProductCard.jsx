import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatUtils';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { id, name, description, finalPrice, tags, images } = product;
  const [added, setAdded] = useState(false);

  let addToCart = () => {};
  try {
    const cart = useCart();
    if (cart?.addToCart) {
      addToCart = cart.addToCart;
    }
  } catch {
    // Fallback si se renderiza fuera de CartProvider en tests unitarios
  }

  const displayImage = images && images.length > 0 ? images[0] : null;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextElementSibling.style.display = 'flex';
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="card h-100 product-card">
      {displayImage ? (
        <>
          <img
            src={displayImage}
            alt={name}
            className="card-img-top"
            style={{ height: '200px', objectFit: 'cover' }}
            onError={handleImageError}
          />
          <div
            className="card-img-top d-flex align-items-center justify-content-center image-placeholder"
            style={{
              height: '200px',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-primary)',
              display: 'none',
            }}
          >
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          className="card-img-top d-flex align-items-center justify-content-center image-placeholder"
          style={{
            height: '200px',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-primary)',
          }}
        >
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <span className="placeholder-text">Sin imagen</span>
          </div>
        </div>
      )}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{name}</h5>
        <p className="card-text text-truncate" style={{ flex: 1 }}>
          {description}
        </p>
        <div className="mb-2">
          {tags && tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <p className="price">{formatPrice(finalPrice)}</p>
        <div className="d-flex gap-2 mt-auto">
          <Link to={`/products/${id}`} className="btn btn-outline-primary flex-grow-1">
            Ver producto
          </Link>
          <button
            type="button"
            className={`btn ${added ? 'btn-success' : 'btn-primary'}`}
            onClick={handleAddToCart}
            aria-label={`Agregar ${name} al carrito`}
            title="Agregar al carrito"
          >
            {added ? '¡Agregado!' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
