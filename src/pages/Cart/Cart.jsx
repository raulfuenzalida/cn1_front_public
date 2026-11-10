import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatUtils';
import LoginForm from '../../components/common/LoginForm';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { isAuthenticated, user, getAccessToken } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  // Sincronizar datos del usuario autenticado
  const activeName = customerName || user?.name || user?.email?.split('@')[0] || '';
  const activeEmail = user?.email || '';

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    const nameToSend = activeName.trim();
    const emailToSend = activeEmail.trim();

    if (!nameToSend) {
      setSubmitError('Por favor ingresa el nombre del cliente');
      return;
    }
    if (!emailToSend) {
      setSubmitError('Por favor confirma el correo electrónico del cliente');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const token = await getAccessToken().catch(() => null);

      const response = await orderService.createOrder(
        {
          customerName: nameToSend,
          customerEmail: emailToSend,
          items,
        },
        token
      );

      setConfirmedOrder(response);
      clearCart();
    } catch (err) {
      console.error('Error al enviar la orden a ms_orders:', err);
      const msg = err.data?.message || err.message || 'Error al procesar el pedido con ms_orders';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!confirmedOrder?.id) return;
    try {
      setIsDownloadingReceipt(true);
      const token = await getAccessToken().catch(() => null);
      await orderService.downloadReceipt(confirmedOrder.id, token);
    } catch (err) {
      console.error('Error descargando comprobante:', err);
      alert('No se pudo descargar el comprobante PDF: ' + err.message);
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // 1. Pantalla de confirmación de pedido exitoso
  if (confirmedOrder) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="card shadow-sm p-4 text-center order-confirmation-card">
              <div className="mb-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: '70px',
                    height: '70px',
                    backgroundColor: 'rgba(96, 108, 56, 0.15)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>

              <h2 className="h3 mb-2">¡Pedido Realizado Exitosamente!</h2>
              <p className="text-muted mb-4">
                Tu orden ha sido registrada en el microservicio <strong>ms_orders</strong>.
              </p>

              <div className="card bg-light text-start p-3 mb-4 order-details-box">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Número de Pedido:</span>
                  <span className="fw-bold">
                    {confirmedOrder.visibleId || `PW-${String(confirmedOrder.id).padStart(6, '0')}`}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Estado:</span>
                  <span className="badge bg-success">{confirmedOrder.status || 'CREATED'}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Cliente:</span>
                  <span className="fw-semibold">{confirmedOrder.customerName || activeName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Correo (Cognito):</span>
                  <span className="fw-semibold">{confirmedOrder.customerEmail || activeEmail}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fs-5 fw-bold">
                  <span>Total Oficial:</span>
                  <span className="price">
                    {formatPrice(confirmedOrder.total || totalPrice)}
                  </span>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                  onClick={handleDownloadReceipt}
                  disabled={isDownloadingReceipt}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {isDownloadingReceipt ? 'Descargando...' : 'Descargar Comprobante PDF'}
                </button>
                <Link to="/catalog" className="btn btn-primary">
                  Seguir Comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pantalla de Carrito Vacío
  if (items.length === 0) {
    return (
      <div className="container my-5 text-center empty-cart-container">
        <div className="py-5">
          <div className="mb-4">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h2 className="h4 mb-3">Tu carrito está vacío</h2>
          <p className="text-muted mb-4">
            Explora nuestro catálogo y agrega los productos de impresión 3D que más te gusten.
          </p>
          <Link to="/catalog" className="btn btn-primary btn-lg">
            Explorar Catálogo
          </Link>
        </div>
      </div>
    );
  }

  // 3. Pantalla de Carrito con Productos y Simulación de Checkout
  return (
    <div className="container my-5">
      <h1 className="h3 mb-4">Carrito de Compras ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</h1>

      <div className="row g-4">
        {/* Lista de productos */}
        <div className="col-lg-8">
          <div className="card shadow-sm mb-3">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ minWidth: '220px' }}>Producto</th>
                      <th scope="col" className="text-center" style={{ width: '130px' }}>Precio</th>
                      <th scope="col" className="text-center" style={{ width: '140px' }}>Cantidad</th>
                      <th scope="col" className="text-end" style={{ width: '130px' }}>Subtotal</th>
                      <th scope="col" className="text-center" style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const { product, quantity } = item;
                      const image = product.images && product.images.length > 0 ? product.images[0] : null;
                      const subtotal = (product.finalPrice || 0) * quantity;

                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="rounded object-fit-cover"
                                  style={{ width: '60px', height: '60px' }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className="rounded d-flex align-items-center justify-content-center text-muted"
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    backgroundColor: 'var(--hover-bg)',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Sin foto
                                </div>
                              )}
                              <div>
                                <Link
                                  to={`/products/${product.id}`}
                                  className="fw-semibold text-decoration-none"
                                >
                                  {product.name}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="text-center text-nowrap">
                            {formatPrice(product.finalPrice)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center justify-content-center quantity-control">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                aria-label="Disminuir cantidad"
                              >
                                -
                              </button>
                              <span className="mx-2 fw-semibold" style={{ minWidth: '24px', textAlign: 'center' }}>
                                {quantity}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="text-end fw-bold price text-nowrap">
                            {formatPrice(subtotal)}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFromCart(product.id)}
                              aria-label={`Eliminar ${product.name} del carrito`}
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-footer bg-transparent d-flex justify-content-between align-items-center py-3">
              <Link to="/catalog" className="btn btn-outline-secondary btn-sm">
                ← Continuar comprando
              </Link>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={clearCart}
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>

        {/* Resumen del pedido y simulación de compra */}
        <div className="col-lg-4">
          <div className="card shadow-sm cart-summary-card mb-3">
            <div className="card-header bg-transparent py-3">
              <h2 className="h5 mb-0">Resumen del Pedido</h2>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Productos:</span>
                <span>{totalItems} uds.</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Total Estimado:</span>
                <span className="fs-5 fw-bold price">{formatPrice(totalPrice)}</span>
              </div>

              <div className="alert alert-secondary py-2 small mb-4" role="note">
                El total definitivo es validado y calculado directamente por <strong>ms_orders</strong> según la vigencia de precios en <strong>ms_products</strong>.
              </div>

              <hr />

              {/* Sección de autenticación y compra */}
              {!isAuthenticated ? (
                <div>
                  <LoginForm
                    title="Inicia sesión para comprar"
                    subtitle="Debes autenticarte con tu email en AWS Cognito para confirmar la compra."
                  />
                </div>
              ) : (
                <form onSubmit={handleCheckout}>
                  <div className="mb-3">
                    <label htmlFor="customer-name" className="form-label small fw-semibold">
                      Nombre del Cliente:
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      className="form-control"
                      value={activeName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="customer-email" className="form-label small fw-semibold">
                      Correo Electrónico (Cognito):
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      className="form-control"
                      value={activeEmail}
                      readOnly
                      title="Correo obtenido desde tu sesión de AWS Cognito"
                      required
                    />
                    <small className="text-muted">Autenticado en AWS Cognito</small>
                  </div>

                  {submitError && (
                    <div className="alert alert-danger py-2 small mb-3" role="alert">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fs-6 fw-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    {isSubmitting ? 'Enviando a ms_orders...' : 'Simular Compra (Enviar Pedido)'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
