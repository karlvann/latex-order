// Preset inventory scenarios for testing and demonstration
// Based on realistic business situations with different stock levels

export const INVENTORY_PRESETS = {
  low: {
    name: 'Low Stock (Critical)',
    description: '~1.5 months coverage - Urgent ordering needed',
    inventory: {
      firm: { Queen: 15, King: 7 },
      medium: { Queen: 133, King: 114 },
      soft: { Queen: 98, King: 56 }
    },
    settings: {
      containerSize: 170
    }
  },
  medium: {
    name: 'Medium Stock (Healthy)',
    description: '~2.5 months coverage - Balanced situation',
    inventory: {
      firm: { Queen: 25, King: 12 },
      medium: { Queen: 223, King: 190 },
      soft: { Queen: 163, King: 93 }
    },
    settings: {
      containerSize: 170
    }
  },
  high: {
    name: 'High Stock (Well-Stocked)',
    description: '~5 months coverage - Recently received containers',
    inventory: {
      firm: { Queen: 50, King: 25 },
      medium: { Queen: 445, King: 380 },
      soft: { Queen: 325, King: 185 }
    },
    settings: {
      containerSize: 170
    }
  }
};

// Helper to get preset by key
export const getPreset = (key) => {
  return INVENTORY_PRESETS[key] || null;
};

// Helper to get all preset keys
export const getPresetKeys = () => {
  return Object.keys(INVENTORY_PRESETS);
};
