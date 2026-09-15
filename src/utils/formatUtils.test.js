import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatUtils';

describe('formatUtils', () => {
  describe('formatPrice', () => {
    it('should format price in CLP format', () => {
      expect(formatPrice(12990)).toBe('$12.990');
    });

    it('should format price with decimals', () => {
      expect(formatPrice(12990.50)).toBe('$12.991');
    });

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('$0');
    });

    it('should handle null or undefined', () => {
      expect(formatPrice(null)).toBe('$0');
      expect(formatPrice(undefined)).toBe('$0');
    });

    it('should handle large numbers', () => {
      expect(formatPrice(1000000)).toBe('$1.000.000');
    });
  });
});
