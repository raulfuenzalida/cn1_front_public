import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from './orderService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate customerName is present', async () => {
    await expect(
      orderService.createOrder({
        customerName: '',
        customerEmail: 'test@printworks.cl',
        items: [{ idProduct: 1, quantity: 1 }],
      })
    ).rejects.toThrow('El nombre del cliente es obligatorio');
  });

  it('should validate customerEmail is present', async () => {
    await expect(
      orderService.createOrder({
        customerName: 'Juan',
        customerEmail: '',
        items: [{ idProduct: 1, quantity: 1 }],
      })
    ).rejects.toThrow('El correo electrónico es obligatorio');
  });

  it('should validate items is not empty', async () => {
    await expect(
      orderService.createOrder({
        customerName: 'Juan',
        customerEmail: 'juan@test.cl',
        items: [],
      })
    ).rejects.toThrow('El pedido debe contener al menos un producto');
  });

  it('should validate items does not exceed 30 distinct products', async () => {
    const tooManyItems = Array.from({ length: 31 }, (_, i) => ({
      idProduct: i + 1,
      quantity: 1,
    }));

    await expect(
      orderService.createOrder({
        customerName: 'Juan',
        customerEmail: 'juan@test.cl',
        items: tooManyItems,
      })
    ).rejects.toThrow('El pedido no puede superar 30 productos distintos');
  });

  it('should send correct payload and headers to POST /api/v1/orders/crear', async () => {
    const mockOrderResponse = {
      id: 1,
      customerName: 'Cliente Test',
      customerEmail: 'cliente@printworks.cl',
      status: 'CREATED',
      total: 25980,
    };
    apiClient.post.mockResolvedValue(mockOrderResponse);

    const result = await orderService.createOrder(
      {
        customerName: 'Cliente Test',
        customerEmail: 'cliente@printworks.cl',
        items: [
          { product: { id: 1 }, quantity: 2 },
          { idProduct: 5, quantity: 1 },
        ],
      },
      'test-bearer-token'
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/v1/orders/crear',
      {
        customerName: 'Cliente Test',
        customerEmail: 'cliente@printworks.cl',
        items: [
          { idProduct: 1, quantity: 2 },
          { idProduct: 5, quantity: 1 },
        ],
      },
      {
        Authorization: 'Bearer test-bearer-token',
      }
    );
    expect(result).toEqual(mockOrderResponse);
  });

  it('should return correct receipt URL', () => {
    const url = orderService.getOrderReceiptUrl(42);
    expect(url).toContain('/api/v1/orders/42/receipt');
  });
});
