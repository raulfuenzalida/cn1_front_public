import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import { productService } from '../../services/productService';

vi.mock('../../services/productService');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/products/:id" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    productService.getProductById.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<ProductDetail />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display product details after loading', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      finalPrice: 12990,
      tags: ['tag1', 'tag2'],
      images: ['test-image.jpg'],
    };
    productService.getProductById.mockResolvedValue(mockProduct);
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('$12.990')).toBeInTheDocument();
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    productService.getProductById.mockRejectedValue(new Error('API Error'));
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar el producto.')).toBeInTheDocument();
    });
  });

  it('should show not found state when product is null', async () => {
    productService.getProductById.mockResolvedValue(null);
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Producto no encontrado.')).toBeInTheDocument();
    });
  });

  it('should display placeholder when product has no images', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      finalPrice: 12990,
      tags: ['tag1'],
      images: [],
    };
    productService.getProductById.mockResolvedValue(mockProduct);
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Sin imagen')).toBeInTheDocument();
    });
  });

  it('should display breadcrumb navigation', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      finalPrice: 12990,
      tags: ['tag1'],
      images: ['test-image.jpg'],
    };
    productService.getProductById.mockResolvedValue(mockProduct);
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Catálogo')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should have back to catalog button', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      description: 'Test description',
      finalPrice: 12990,
      tags: ['tag1'],
      images: ['test-image.jpg'],
    };
    productService.getProductById.mockResolvedValue(mockProduct);
    
    window.history.pushState({}, '', '/products/1');
    renderWithRouter(<ProductDetail />);
    
    await waitFor(() => {
      const backButton = screen.getByText('Volver al catálogo');
      expect(backButton).toBeInTheDocument();
    });
  });
});
