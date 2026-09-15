export const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return '$0';
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
