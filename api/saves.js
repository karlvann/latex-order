// Vercel Serverless Function for Save/Load with Vercel KV
// Integrated with Upstash Redis via Vercel Marketplace
import { kv } from '@vercel/kv';

const NUM_SLOTS = 5;
const KV_PREFIX = 'latex_order_save_';

// Helper to create empty slot
const createEmptySlot = (slotNumber) => ({
  name: `Save ${slotNumber}`,
  timestamp: null,
  data: null
});

export default async function handler(req, res) {
  const { slot } = req.query;

  try {
    // LIST ALL SAVES
    if (req.method === 'GET' && !slot) {
      const saves = [];
      for (let i = 1; i <= NUM_SLOTS; i++) {
        const key = `${KV_PREFIX}${i}`;
        const saved = await kv.get(key);
        saves.push(saved || createEmptySlot(i));
      }
      return res.status(200).json(saves);
    }

    // LOAD SPECIFIC SAVE
    if (req.method === 'GET' && slot) {
      const slotNumber = parseInt(slot);
      if (slotNumber < 1 || slotNumber > NUM_SLOTS) {
        return res.status(400).json({ error: 'Invalid slot number' });
      }

      const key = `${KV_PREFIX}${slotNumber}`;
      const saved = await kv.get(key);

      if (!saved) {
        return res.status(404).json({ error: `No save found in slot ${slotNumber}` });
      }

      return res.status(200).json(saved);
    }

    // SAVE DATA
    if (req.method === 'POST' && slot) {
      const slotNumber = parseInt(slot);
      if (slotNumber < 1 || slotNumber > NUM_SLOTS) {
        return res.status(400).json({ error: 'Invalid slot number' });
      }

      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'No data provided' });
      }

      const key = `${KV_PREFIX}${slotNumber}`;

      // Check if slot exists to preserve custom name
      const existing = await kv.get(key);
      const saveData = {
        name: existing?.name || `Save ${slotNumber}`,
        timestamp: new Date().toISOString(),
        data
      };

      await kv.set(key, saveData);
      return res.status(200).json(saveData);
    }

    // UPDATE SLOT NAME
    if (req.method === 'PUT' && slot) {
      const slotNumber = parseInt(slot);
      if (slotNumber < 1 || slotNumber > NUM_SLOTS) {
        return res.status(400).json({ error: 'Invalid slot number' });
      }

      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid name provided' });
      }

      const key = `${KV_PREFIX}${slotNumber}`;
      const saved = await kv.get(key);

      if (!saved) {
        return res.status(404).json({ error: `No save found in slot ${slotNumber}` });
      }

      saved.name = name.trim();
      await kv.set(key, saved);
      return res.status(200).json(saved);
    }

    // DELETE SAVE
    if (req.method === 'DELETE' && slot) {
      const slotNumber = parseInt(slot);
      if (slotNumber < 1 || slotNumber > NUM_SLOTS) {
        return res.status(400).json({ error: 'Invalid slot number' });
      }

      const key = `${KV_PREFIX}${slotNumber}`;
      await kv.del(key);
      return res.status(200).json({ success: true });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
