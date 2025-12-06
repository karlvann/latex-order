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
      `;
      return res.status(200).json(saves);
    }

    // POST - Create new save
    if (req.method === 'POST') {
      const { name, inventory, annualRevenue } = req.body;

      if (!name || !inventory) {
        return res.status(400).json({ error: 'Name and inventory required' });
      }

      const result = await sql`
        INSERT INTO saves (name, inventory, annual_revenue)
        VALUES (${name}, ${JSON.stringify(inventory)}, ${annualRevenue || 0})
        RETURNING id, name, created_at
      `;

      return res.status(201).json(result[0]);
    }

    // DELETE - Remove a save
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID required' });
      }

      await sql`DELETE FROM saves WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
