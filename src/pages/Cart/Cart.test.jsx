import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cart from './Cart';
import * as CartContextModule from '../../context/CartContext';
import * as AuthContextModule from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

vi.mock('../../services/orderService', () => ({
  orderService: {
    createOrder: vi.fn(),
    downloadReceipt: vi.fn(),
  },
}));

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty cart view when cart is empty', () => {
    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: [],
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      getAccessToken: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByText('Explorar Catálogo')).toBeInTheDocument();
  });

  it('should display items, quantities and show login form if user is unauthenticated', () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    const mockItems = [
      {
        product: { id: 1, name: 'Soporte Auriculares', finalPrice: 15000, images: [] },
        quantity: 2,
      },
    ];

    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: mockItems,
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 2,
      totalPrice: 30000,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      getAccessToken: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByText('Soporte Auriculares')).toBeInTheDocument();
    expect(screen.getByText('$15.000')).toBeInTheDocument();
    expect(screen.getAllByText('$30.000')).toHaveLength(2);
    expect(screen.getByText('Inicia sesión para comprar')).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Correo Electrónico:/i);
    const passInput = screen.getByLabelText(/Contraseña:/i);
    const loginBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: 'maria@printworks.cl' } });
    fireEvent.change(passInput, { target: { value: 'pass1234' } });
    fireEvent.click(loginBtn);

    expect(mockLogin).toHaveBeenCalledWith('maria@printworks.cl', 'pass1234');
  });

  it('should allow authenticated user to submit order and view confirmation', async () => {
    const mockClearCart = vi.fn();
    const mockItems = [
      {
        product: { id: 1, name: 'Soporte Auriculares', finalPrice: 15000, images: [] },
        quantity: 2,
      },
    ];

    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: mockItems,
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: mockClearCart,
      totalItems: 2,
      totalPrice: 30000,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        name: 'Maria Paz',
        email: 'maria@printworks.cl',
        roles: ['usuarios'],
      },
      login: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue('cognito-token-xyz'),
    });

    orderService.createOrder.mockResolvedValue({
      id: 10,
      visibleId: 'PW-000010',
      customerName: 'Maria Paz',
      customerEmail: 'maria@printworks.cl',
      status: 'CREATED',
      total: 30000,
    });

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    expect(screen.getByDisplayValue('Maria Paz')).toBeInTheDocument();
    expect(screen.getByDisplayValue('maria@printworks.cl')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Simular Compra/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith(
        {
          customerName: 'Maria Paz',
          customerEmail: 'maria@printworks.cl',
          items: mockItems,
        },
        'cognito-token-xyz'
      );
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(screen.getByText('¡Pedido Realizado Exitosamente!')).toBeInTheDocument();
      expect(screen.getByText('PW-000010')).toBeInTheDocument();
    });
  });

  it('should display error message when order creation fails', async () => {
    const mockItems = [
      {
        product: { id: 1, name: 'Soporte Auriculares', finalPrice: 15000, images: [] },
        quantity: 1,
      },
    ];

    vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
      items: mockItems,
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 1,
      totalPrice: 15000,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      user: {
        name: 'Maria Paz',
        email: 'maria@printworks.cl',
      },
      login: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue(null),
    });

    orderService.createOrder.mockRejectedValue(
      new Error('El producto no se encuentra disponible')
    );

    render(
      <BrowserRouter>
        <Cart />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Simular Compra/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('El producto no se encuentra disponible')
      ).toBeInTheDocument();
    });
  });
});
