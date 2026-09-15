import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Catalog from './Catalog';
import { productService } from '../../services/productService';

vi.mock('../../services/productService');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Catalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    productService.getProducts.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<Catalog />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display products after loading', async () => {
    const mockResponse = {
      content: [
        { id: 1, name: 'Product 1', description: 'Description 1', finalPrice: 12990, tags: ['tag1'], images: ['img1.jpg'] },
        { id: 2, name: 'Product 2', description: 'Description 2', finalPrice: 15990, tags: ['tag2'], images: ['img2.jpg'] },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 12,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('should show empty state when no products found', async () => {
    const mockResponse = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 12,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('No se encontraron productos con los filtros seleccionados.')).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    productService.getProducts.mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar los productos.')).toBeInTheDocument();
    });
  });

  it('should apply filters', async () => {
    const mockResponse = {
      content: [{ id: 1, name: 'Product 1', description: 'Description 1', finalPrice: 12990, tags: ['tag1'], images: ['img1.jpg'] }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 12,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar por nombre...')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByPlaceholderText('Buscar por nombre...');
    nameInput.value = 'test';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  });

  it('should display pagination when multiple pages exist', async () => {
    const mockResponse = {
      content: [{ id: 1, name: 'Product 1', description: 'Description 1', finalPrice: 12990, tags: ['tag1'], images: ['img1.jpg'] }],
      totalElements: 25,
      totalPages: 3,
      number: 0,
      size: 12,
    };
    productService.getProducts.mockResolvedValue(mockResponse);
    
    renderWithRouter(<Catalog />);
    
    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
      expect(screen.getByText('Siguiente')).toBeInTheDocument();
    });
  });
});
