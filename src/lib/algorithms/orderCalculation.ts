// Order calculation algorithm based on proportional distribution

import { LatexInventory, OrderQuantities } from '../types';
import { MONTHLY_SALES_RATE, FIRMNESS_DISTRIBUTION } from '../constants';
import { getTotalUnits, createEmptyInventory } from '../utils/inventory';

export function calculateOrder(
  containerSize: number,
  currentInventory: LatexInventory
): OrderQuantities {
  const order = createEmptyInventory();

  // Calculate current total stock
  const currentTotal = getTotalUnits(currentInventory);

  // Target stock = current + container
  const targetTotal = currentTotal + containerSize;

  // Calculate stock gap for each SKU
  const gaps: { [key: string]: number } = {};
  let totalGap = 0;

  ['Queen', 'King'].forEach(size => {
    ['firm', 'medium', 'soft'].forEach(firmness => {
      const currentStock = currentInventory[firmness as keyof LatexInventory][size as 'Queen' | 'King'];
      const saleRate = MONTHLY_SALES_RATE[size as 'Queen' | 'King'];
      const firmnessRatio = FIRMNESS_DISTRIBUTION[size as 'Queen' | 'King'][firmness];
      const targetStock = (targetTotal * (saleRate / (MONTHLY_SALES_RATE.Queen + MONTHLY_SALES_RATE.King))) * firmnessRatio;
      const gap = Math.max(0, targetStock - currentStock);

      gaps[`${firmness}_${size}`] = gap;
      totalGap += gap;
    });
  });

  // Distribute container proportionally based on gaps
  ['Queen', 'King'].forEach(size => {
    ['firm', 'medium', 'soft'].forEach(firmness => {
      const key = `${firmness}_${size}`;
      const gap = gaps[key];
      const proportion = totalGap > 0 ? gap / totalGap : 0;
      const quantity = Math.round(containerSize * proportion);

      order[firmness as keyof LatexInventory][size as 'Queen' | 'King'] = quantity;
    });
  });

  // Adjust to match exact container size (handle rounding)
  const orderTotal = getTotalUnits(order);
  const difference = containerSize - orderTotal;

  if (difference !== 0) {
    // Add/subtract from the item with the largest gap
    let maxGap = 0;
    let maxKey = '';

    Object.entries(gaps).forEach(([key, gap]) => {
      if (gap > maxGap) {
        maxGap = gap;
        maxKey = key;
      }
    });

    if (maxKey) {
      const [firmness, size] = maxKey.split('_');
      order[firmness as keyof LatexInventory][size as 'Queen' | 'King'] += difference;
    }
  }

  return order;
}
