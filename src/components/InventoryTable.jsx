import React from 'react';

export default function InventoryTable({ inventory, onChange }) {
  const handleChange = (firmness, size, value) => {
    const newInventory = { ...inventory };
    newInventory[firmness] = { ...newInventory[firmness] };
    newInventory[firmness][size] = parseInt(value) || 0;
    onChange(newInventory);
  };

  const sizes = ['Queen', 'King'];
  const firmnesses = ['firm', 'medium', 'soft'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ padding: '12px', textAlign: 'left', background: '#1a1a1a' }}>Firmness</th>
            {sizes.map(size => (
              <th key={size} style={{ padding: '12px', textAlign: 'center', background: '#1a1a1a' }}>
                {size}
              </th>
            ))}
            <th style={{ padding: '12px', textAlign: 'center', background: '#1a1a1a' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {firmnesses.map(firmness => {
            const rowTotal = sizes.reduce((sum, size) => sum + (inventory[firmness][size] || 0), 0);
            return (
              <tr key={firmness} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{firmness}</td>
                {sizes.map(size => (
                  <td key={size} style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={inventory[firmness][size] || 0}
                      onChange={(e) => handleChange(firmness, size, e.target.value)}
                      style={{
                        width: '80px',
                        padding: '6px',
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fafafa',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  {rowTotal}
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
            <td style={{ padding: '12px' }}>Total</td>
            {sizes.map(size => {
              const colTotal = firmnesses.reduce((sum, firmness) =>
                sum + (inventory[firmness][size] || 0), 0
              );
              return (
                <td key={size} style={{ padding: '12px', textAlign: 'center' }}>
                  {colTotal}
                </td>
              );
            })}
            <td style={{ padding: '12px', textAlign: 'center', color: '#4a9eff' }}>
              {firmnesses.reduce((sum, firmness) =>
                sum + sizes.reduce((s, size) => s + (inventory[firmness][size] || 0), 0), 0
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
