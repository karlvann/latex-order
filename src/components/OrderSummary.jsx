import React from 'react';

export default function OrderSummary({ order, inventory }) {
  const sizes = ['Queen', 'King'];
  const firmnesses = ['firm', 'medium', 'soft'];

  const getTotalBySize = (data, size) => {
    return firmnesses.reduce((sum, f) => sum + (data[f][size] || 0), 0);
  };

  const getTotalByFirmness = (data, firmness) => {
    return sizes.reduce((sum, s) => sum + (data[firmness][s] || 0), 0);
  };

  const getGrandTotal = (data) => {
    return firmnesses.reduce((sum, f) =>
      sum + sizes.reduce((s, size) => s + (data[f][size] || 0), 0), 0
    );
  };

  const orderTotal = getGrandTotal(order);

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
            const rowTotal = getTotalByFirmness(order, firmness);
            return (
              <tr key={firmness} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{firmness}</td>
                {sizes.map(size => {
                  const qty = order[firmness][size] || 0;
                  return (
                    <td key={size} style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: qty > 0 ? '#44ff88' : '#666',
                      fontWeight: qty > 0 ? 'bold' : 'normal'
                    }}>
                      {qty}
                    </td>
                  );
                })}
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  {rowTotal}
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
            <td style={{ padding: '12px' }}>Total</td>
            {sizes.map(size => {
              const colTotal = getTotalBySize(order, size);
              return (
                <td key={size} style={{ padding: '12px', textAlign: 'center' }}>
                  {colTotal}
                </td>
              );
            })}
            <td style={{ padding: '12px', textAlign: 'center', color: '#4a9eff', fontSize: '16px' }}>
              {orderTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
