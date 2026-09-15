import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';
import { productService } from '../../services/productService';

vi.mock('../../services/productService');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    productService.getProducts.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<Home />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display hero section', () => {
    productService.getProducts.mockResolvedValue({ content: [] });
    
    renderWithRouter(<Home />);
    
    expect(screen.getByText('Bienvenido a PrintWorks')).toBeInTheDocument();
    expect(screen.getByText('Tu tienda de impresión 3D de confianza')).toBeInTheDocument();
    expect(screen.getByText('Ver catálogo')).toBeInTheDocument();
  });

  it('should display featured products after loading', async () => {
    const mockResponse = {
      content: [
        { id: 1, name: 'Product 1', description: 'Description 1', finalPrice: 12990, tags: ['tag1'], images: ['img1.jpg'] },
        { id: 2, name: 'Product 2', description: 'Description 2', finalPrice: 15990, tags: ['tag2'], images: ['img2.jpg'] },
        { id: 3, name: 'Product 3', description: 'Description 3', finalPrice: 19990, tags: ['tag3'], images: ['img3.jpg'] },
      ],
      totalElements: 3,
      totalPages: 1,
      number: 0,
      size: 3,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });
  });

  it('should show empty state when no products found', async () => {
    const mockResponse = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 3,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('No hay productos disponibles en este momento.')).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    productService.getProducts.mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar los productos destacados.')).toBeInTheDocument();
    });
  });

  it('should fetch only 3 products for featured section', async () => {
    const mockResponse = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 3,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Home />);
    
    await waitFor(() => {
      expect(productService.getProducts).toHaveBeenCalledWith({ page: 0, size: 3 });
    });
  });

  it('should have link to full catalog', async () => {
    const mockResponse = {
      content: [{ id: 1, name: 'Product 1', description: 'Description 1', finalPrice: 12990, tags: ['tag1'], images: ['img1.jpg'] }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 3,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Home />);
    
    await waitFor(() => {
      const catalogLink = screen.getByText('Ver todo el catálogo');
      expect(catalogLink).toBeInTheDocument();
      expect(catalogLink).toHaveAttribute('href', '/catalog');
    });
  });
});
