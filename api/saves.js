import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Initialize table on first request
async function initTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS saves (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      inventory JSONB NOT NULL,
      usage_rates JSONB,
      annual_revenue INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add usage_rates column if it doesn't exist (migration for existing tables)
  try {
    await sql`ALTER TABLE saves ADD COLUMN IF NOT EXISTS usage_rates JSONB`;
  } catch (e) {
    // Column might already exist, ignore error
  }
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
        SELECT id, name, inventory, usage_rates, annual_revenue, created_at
        FROM saves
        ORDER BY created_at DESC
        LIMIT 50
      `;
      return res.status(200).json(saves);
    }

    // POST - Create new save
    if (req.method === 'POST') {
      const { name, inventory, usageRates, annualRevenue } = req.body;

      // Validate name
      if (!name || typeof name !== 'string' || name.length > 255) {
        return res.status(400).json({ error: 'Invalid name (max 255 chars)' });
      }

      // Validate inventory structure
      if (!isValidInventory(inventory)) {
        return res.status(400).json({ error: 'Invalid inventory structure' });
      }

      // Support both old and new format
      const revenue = annualRevenue ? parseInt(annualRevenue, 10) : null;

      const result = await sql`
        INSERT INTO saves (name, inventory, usage_rates, annual_revenue)
        VALUES (
          ${name.trim().slice(0, 255)},
          ${JSON.stringify(inventory)},
          ${usageRates ? JSON.stringify(usageRates) : null},
          ${revenue}
        )
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
