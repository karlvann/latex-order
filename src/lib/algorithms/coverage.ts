// Calculate inventory coverage in months

import { LatexInventory } from '../types';
import { MONTHLY_SALES_RATE } from '../constants';

export function calculateCoverage(
  inventory: LatexInventory,
  size: 'Queen' | 'King'
): number {
  const totalStock =
    inventory.firm[size] +
    inventory.medium[size] +
    inventory.soft[size];

  const monthlySales = MONTHLY_SALES_RATE[size];

  if (monthlySales === 0) return 0;

  return totalStock / monthlySales;
}

export function calculateCoverageByFirmness(
  inventory: LatexInventory,
  size: 'Queen' | 'King',
  firmness: 'firm' | 'medium' | 'soft'
): number {
  const stock = inventory[firmness][size];
  const monthlySales = MONTHLY_SALES_RATE[size];

  // Use the firmness distribution to calculate specific firmness sales
  const { FIRMNESS_DISTRIBUTION } = require('../constants/firmness');
  const firmnessRatio = FIRMNESS_DISTRIBUTION[size][firmness];
  const firmnessSales = monthlySales * firmnessRatio;

  if (firmnessSales === 0) return 0;

  return stock / firmnessSales;
}
