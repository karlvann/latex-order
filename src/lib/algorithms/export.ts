// Export generation for orders

import { OrderQuantities } from '../types';
import { getTotalUnits } from '../utils/inventory';

export function generateTSV(order: OrderQuantities): string {
  const lines: string[] = [];

  // Header
  lines.push('Size\tDensity\tQuantity');

  // Map to the format used in the spreadsheet
  // Example: 203*152*5.0 = Queen, 203*183*5.0 = King
  const sizeMap = {
    'Queen': '203*152*5.0',
    'King': '203*183*5.0'
  };

  const densityMap = {
    'soft': '55D',
    'medium': '70D',
    'firm': '90D'
  };

  // Generate rows
  ['Queen', 'King'].forEach(size => {
    ['firm', 'medium', 'soft'].forEach(firmness => {
      const quantity = order[firmness as keyof OrderQuantities][size as 'Queen' | 'King'];
      if (quantity > 0) {
        const sizeCode = sizeMap[size as 'Queen' | 'King'];
        const densityCode = densityMap[firmness];
        lines.push(`${sizeCode}\t${densityCode}\t${quantity}`);
      }
    });
  });

  // Add total
  const total = getTotalUnits(order);
  lines.push(`\nTotal\t\t${total}`);

  return lines.join('\n');
}

export function generateOrderSummary(order: OrderQuantities): {
  totalUnits: number;
  bySize: { Queen: number; King: number };
  byFirmness: { firm: number; medium: number; soft: number };
} {
  return {
    totalUnits: getTotalUnits(order),
    bySize: {
      Queen: order.firm.Queen + order.medium.Queen + order.soft.Queen,
      King: order.firm.King + order.medium.King + order.soft.King,
    },
    byFirmness: {
      firm: order.firm.Queen + order.firm.King,
      medium: order.medium.Queen + order.medium.King,
      soft: order.soft.Queen + order.soft.King,
    },
  };
}
