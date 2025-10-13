// Utility functions for inventory management

import { LatexInventory } from '../types';

export function createEmptyInventory(): LatexInventory {
  return {
    firm: { Queen: 0, King: 0 },
    medium: { Queen: 0, King: 0 },
    soft: { Queen: 0, King: 0 },
  };
}

export function getTotalBySize(inventory: LatexInventory, size: 'Queen' | 'King'): number {
  return inventory.firm[size] + inventory.medium[size] + inventory.soft[size];
}

export function getTotalByFirmness(inventory: LatexInventory, firmness: 'firm' | 'medium' | 'soft'): number {
  return inventory[firmness].Queen + inventory[firmness].King;
}

export function getTotalUnits(inventory: LatexInventory): number {
  return getTotalBySize(inventory, 'Queen') + getTotalBySize(inventory, 'King');
}
