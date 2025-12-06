import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Initialize table on first request
async function initTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS saves (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      inventory JSONB NOT NULL,
      annual_revenue INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// Validate inventory structure
function isValidInventory(inv) {
  if (!inv || typeof inv !== 'object') return false;
  const firmnesses = ['firm', 'medium', 'soft'];
  const sizes = ['Queen', 'King'];

  return firmnesses.every(f =>
    inv[f] && typeof inv[f] === 'object' &&
    sizes.every(s => typeof inv[f][s] === 'number' && inv[f][s] >= 0)
  );
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initTable();

    // GET - List all saves
    if (req.method === 'GET') {
      const saves = await sql`
        SELECT id, name, inventory, annual_revenue, created_at
        FROM saves
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return res.status(200).json(saves);
    }

    // POST - Create new save
    if (req.method === 'POST') {
      const { name, inventory, annualRevenue } = req.body;

      // Validate name
      if (!name || typeof name !== 'string' || name.length > 255) {
        return res.status(400).json({ error: 'Invalid name (max 255 chars)' });
      }

      // Validate inventory structure
      if (!isValidInventory(inventory)) {
        return res.status(400).json({ error: 'Invalid inventory structure' });
      }

      // Validate annual revenue
      const revenue = parseInt(annualRevenue, 10) || 0;
      if (revenue < 0 || revenue > 100000000) {
        return res.status(400).json({ error: 'Invalid annual revenue' });
      }

      const result = await sql`
        INSERT INTO saves (name, inventory, annual_revenue)
        VALUES (${name.trim().slice(0, 255)}, ${JSON.stringify(inventory)}, ${revenue})
        RETURNING id, name, created_at
      `;

      return res.status(201).json(result[0]);
    }

    // DELETE - Remove a save
    if (req.method === 'DELETE') {
      const { id } = req.query;

      // Validate ID is a positive integer
      const saveId = parseInt(id, 10);
      if (!saveId || saveId <= 0) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      await sql`DELETE FROM saves WHERE id = ${saveId}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error', message: error.message });
  }
}
