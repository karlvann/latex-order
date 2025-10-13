// Firmness distribution based on actual LATEX PIECE usage
// Source: "Latex Order.xlsx" - USAGE RATES section (rows 42-48)

export const FIRMNESS_DISTRIBUTION = {
  'Queen': {
    'firm': 0.0652,    // 3 / 46 = 6.52% (3 pieces/month)
    'medium': 0.5435,  // 25 / 46 = 54.35% (25 pieces/month)
    'soft': 0.3913,    // 18 / 46 = 39.13% (18 pieces/month)
  },
  'King': {
    'firm': 0.0294,    // 1 / 34 = 2.94% (1 piece/month)
    'medium': 0.6471,  // 22 / 34 = 64.71% (22 pieces/month)
    'soft': 0.3235,    // 11 / 34 = 32.35% (11 pieces/month)
  },
};

export const FIRMNESS_TYPES = ['firm', 'medium', 'soft'];
