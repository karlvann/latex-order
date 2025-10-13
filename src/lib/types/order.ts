// Type definitions for orders

import { LatexInventory } from './inventory';

export interface OrderQuantities extends LatexInventory {
  // Same structure as inventory - quantities to order
}

export interface OrderSummary {
  totalUnits: number;
  bySize: {
    Queen: number;
    King: number;
  };
  byFirmness: {
    firm: number;
    medium: number;
    soft: number;
  };
}
