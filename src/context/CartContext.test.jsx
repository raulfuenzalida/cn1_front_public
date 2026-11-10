import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

const TestComponent = () => {
  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  return (
    <div>
      <span data-testid="total-items">{totalItems}</span>
      <span data-testid="total-price">{totalPrice}</span>
      <span data-testid="items-count">{items.length}</span>
      <button
        onClick={() => addToCart({ id: 1, name: 'Item 1', finalPrice: 1000 }, 2)}
      >
        Add Item 1
      </button>
      <button
        onClick={() => addToCart({ id: 2, name: 'Item 2', finalPrice: 500 }, 1)}
      >
        Add Item 2
      </button>
      <button onClick={() => updateQuantity(1, 5)}>Update Item 1</button>
      <button onClick={() => removeFromCart(1)}>Remove Item 1</button>
      <button onClick={clearCart}>Clear All</button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0');
    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
  });

  it('should add products and calculate totals correctly', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Agregar Item 1 (qty 2, price 1000)
    act(() => {
      screen.getByText('Add Item 1').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
    expect(screen.getByTestId('total-price')).toHaveTextContent('2000');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');

    // Agregar Item 2 (qty 1, price 500)
    act(() => {
      screen.getByText('Add Item 2').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
    expect(screen.getByTestId('total-price')).toHaveTextContent('2500');
    expect(screen.getByTestId('items-count')).toHaveTextContent('2');
  });

  it('should increment quantity when adding existing product', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add Item 1').click();
      screen.getByText('Add Item 1').click();
    });

    // 2 + 2 = 4 unidades
    expect(screen.getByTestId('total-items')).toHaveTextContent('4');
    expect(screen.getByTestId('total-price')).toHaveTextContent('4000');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
  });

  it('should update quantity of an item', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add Item 1').click();
      screen.getByText('Update Item 1').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('5');
    expect(screen.getByTestId('total-price')).toHaveTextContent('5000');
  });

  it('should remove item from cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add Item 1').click();
      screen.getByText('Add Item 2').click();
      screen.getByText('Remove Item 1').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('500');
    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
  });

  it('should clear all items', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      screen.getByText('Add Item 1').click();
      screen.getByText('Clear All').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0');
    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
  });

  it('should persist and load cart from localStorage', () => {
    const initialItems = [{ product: { id: 99, finalPrice: 3000 }, quantity: 1 }];
    localStorage.setItem('printworks_cart', JSON.stringify(initialItems));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('3000');
  });
});
