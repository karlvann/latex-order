// Storage adapter for save/load functionality
// Uses localStorage in development

const STORAGE_PREFIX = 'latex_order_save_';
const NUM_SLOTS = 5;

// Initialize empty save slot
const createEmptySlot = (slotNumber) => ({
  name: `Save ${slotNumber}`,
  timestamp: null,
  data: null
});

// === LocalStorage Implementation ===

const localStorageAdapter = {
  async listSaves() {
    const saves = [];
    for (let i = 1; i <= NUM_SLOTS; i++) {
      const key = `${STORAGE_PREFIX}${i}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          saves.push(JSON.parse(saved));
        } catch (e) {
          saves.push(createEmptySlot(i));
        }
      } else {
        saves.push(createEmptySlot(i));
      }
    }
    return saves;
  },

  async loadSave(slot) {
    const key = `${STORAGE_PREFIX}${slot}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      throw new Error(`No save found in slot ${slot}`);
    }
    return JSON.parse(saved);
  },

  async saveSave(slot, data) {
    const key = `${STORAGE_PREFIX}${slot}`;
    const saveData = {
      name: `Save ${slot}`,
      timestamp: new Date().toISOString(),
      data
    };

    // Check if slot already exists to preserve custom name
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const existingData = JSON.parse(existing);
        saveData.name = existingData.name; // Preserve custom name
      } catch (e) {
        // Use default name if parsing fails
      }
    }

    localStorage.setItem(key, JSON.stringify(saveData));
    return saveData;
  },

  async updateSlotName(slot, name) {
    const key = `${STORAGE_PREFIX}${slot}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      throw new Error(`No save found in slot ${slot}`);
    }

    const saveData = JSON.parse(saved);
    saveData.name = name;
    localStorage.setItem(key, JSON.stringify(saveData));
    return saveData;
  },

  async deleteSave(slot) {
    const key = `${STORAGE_PREFIX}${slot}`;
    localStorage.removeItem(key);
  }
};

// === Export unified interface ===

const storage = localStorageAdapter;

export const listSaves = () => storage.listSaves();
export const loadSave = (slot) => storage.loadSave(slot);
export const saveSave = (slot, data) => storage.saveSave(slot, data);
export const updateSlotName = (slot, name) => storage.updateSlotName(slot, name);
export const deleteSave = (slot) => storage.deleteSave(slot);
export const NUM_SAVE_SLOTS = NUM_SLOTS;
