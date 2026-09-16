import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from './productService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products without parameters', async () => {
      const mockResponse = {
        content: [{ id: 1, name: 'Product 1' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 12,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await productService.getProducts();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products/obtener');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch products with pagination parameters', async () => {
      const mockResponse = {
        content: [{ id: 1, name: 'Product 1' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await productService.getProducts({ page: 0, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products/obtener?page=0&size=10');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch products with filter parameters', async () => {
      const mockResponse = {
        content: [{ id: 1, name: 'Product 1' }],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 12,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await productService.getProducts({
        name: 'test',
        minPrice: 100,
        maxPrice: 1000,
        sort: 'finalPrice,asc',
      });

      expect(apiClient.get).toHaveBeenCalled();
      const callArgs = apiClient.get.mock.calls[0][0];
      expect(callArgs).toContain('/api/v1/products/obtener?');
      expect(callArgs).toContain('name=test');
      expect(callArgs).toContain('minPrice=100');
      expect(callArgs).toContain('maxPrice=1000');
      expect(callArgs).toContain('sort=finalPrice');
      expect(callArgs).toContain('asc');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        description: 'Test product',
        finalPrice: 9990,
        tags: ['tag1'],
        images: ['image1.jpg'],
      };
      apiClient.get.mockResolvedValue(mockProduct);

      const result = await productService.getProductById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/products/obtener/1');
      expect(result).toEqual(mockProduct);
    });

    it('should handle API errors when fetching product by ID', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(productService.getProductById(1)).rejects.toThrow('Network error');
    });
  });

  describe('getProducts error handling', () => {
    it('should handle API errors when fetching products', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(productService.getProducts()).rejects.toThrow('Network error');
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 12,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await productService.getProducts();

      expect(result.content).toEqual([]);
      expect(result.totalElements).toBe(0);
    });
  });
});
