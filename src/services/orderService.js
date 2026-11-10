import { apiClient } from './apiClient';

export const orderService = {
  /**
   * Envía la creación de un nuevo pedido al microservicio ms_orders.
   * Contrato esperado por POST /api/v1/orders/crear:
   * {
   *   "customerName": "...",
   *   "customerEmail": "...",
   *   "items": [
   *     { "idProduct": 1, "quantity": 2 }
   *   ]
   * }
   */
  async createOrder({ customerName, customerEmail, items }, accessToken = null) {
    if (!customerName || !customerName.trim()) {
      throw new Error('El nombre del cliente es obligatorio');
    }
    if (!customerEmail || !customerEmail.trim()) {
      throw new Error('El correo electrónico es obligatorio');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto');
    }
    if (items.length > 30) {
      throw new Error('El pedido no puede superar 30 productos distintos');
    }

    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      items: items.map(item => ({
        idProduct: item.product?.id ?? item.idProduct ?? item.id,
        quantity: item.quantity,
      })),
    };

    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return apiClient.post('/api/v1/orders/crear', payload, headers);
  },

  /**
   * Retorna la URL directa del comprobante PDF.
   */
  getOrderReceiptUrl(orderId) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}/api/v1/orders/${orderId}/receipt`;
  },

  /**
   * Descarga el comprobante PDF enviando el Access Token en el header Authorization.
   */
  async downloadReceipt(orderId, accessToken = null) {
    const url = this.getOrderReceiptUrl(orderId);
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`No se pudo descargar el comprobante (status ${response.status})`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `comprobante-orden-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
