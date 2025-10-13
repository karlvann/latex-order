// Type definitions for latex mattress inventory

export type FirmnessType = 'firm' | 'medium' | 'soft';
export type SizeType = 'Queen' | 'King';

export interface LatexInventory {
  firm: {
    Queen: number;
    King: number;
  };
  medium: {
    Queen: number;
    King: number;
  };
  soft: {
    Queen: number;
    King: number;
  };
}

export interface CoverageData {
  [size: string]: number; // months of coverage
}
