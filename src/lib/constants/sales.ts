// LATEX PIECE USAGE RATES (from spreadsheet "Latex Order.xlsx" - USAGE RATES section)
// Note: These are LATEX PIECES, not mattresses
// Source: "Mattress Order" sheet, rows 42-48

// Exact monthly latex piece usage by SKU (from spreadsheet):
export const SKU_MONTHLY_USAGE = {
  'Queen': {
    'firm': 3,      // Queen Firm: 3 pieces/month
    'medium': 25,   // Queen Medium: 25 pieces/month
    'soft': 18      // Queen Soft: 18 pieces/month
  },
  'King': {
    'firm': 1,      // King Firm: 1 piece/month
    'medium': 22,   // King Medium: 22 pieces/month
    'soft': 11      // King Soft: 11 pieces/month
  }
};

// Total latex pieces per month by size
export const MONTHLY_SALES_RATE = {
  'Queen': 46,  // 3 + 25 + 18 = 46 pieces/month
  'King': 34,   // 1 + 22 + 11 = 34 pieces/month
};

export const TOTAL_MONTHLY_SALES = 80; // Total latex pieces per month (77 actual + rounding)

// For reference: mattress sales data
// IMPORTANT: Each mattress uses exactly 1 piece of latex (1:1 ratio)
export const MATTRESS_SALES_DATA = {
  totalMattressesPerMonth: 80,     // 80 pieces = 80 mattresses (1:1 ratio)
  totalMattressesPerYear: 960,     // 80 × 12 months
  queenMattressesPerMonth: 46,     // Same as Queen latex pieces
  kingMattressesPerMonth: 34,      // Same as King latex pieces
  latexPiecesPerMattress: 1.0,     // Exactly 1 piece per mattress
};
