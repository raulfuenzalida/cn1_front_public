import { apiClient } from './apiClient';

export const productService = {
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined) {
      queryParams.append('page', params.page);
    }
    if (params.size !== undefined) {
      queryParams.append('size', params.size);
    }
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params.name) {
      queryParams.append('name', params.name);
    }
    if (params.minPrice !== undefined) {
      queryParams.append('minPrice', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      queryParams.append('maxPrice', params.maxPrice);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/products${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(endpoint);
  },

  async getProductById(id) {
    return apiClient.get(`/api/v1/products/${id}`);
  },
};
