import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { ThemeProvider } from '../../context/ThemeContext';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';

const renderNavbar = (cartItems = []) => {
  localStorage.setItem('printworks_cart', JSON.stringify(cartItems));

  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Navbar />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render brand and navigation links', () => {
    renderNavbar();

    expect(screen.getByText('PrintWorks')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Carrito')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('should not show cart badge when cart is empty', () => {
    renderNavbar([]);

    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument();
  });

  it('should show cart badge with correct total quantity when cart has items', () => {
    const items = [
      { product: { id: 1 }, quantity: 2 },
      { product: { id: 2 }, quantity: 3 },
    ];
    renderNavbar(items);

    const badge = screen.getByTestId('cart-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });
});
