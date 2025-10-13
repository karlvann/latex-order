import React from 'react';

export default function CoverageCard({ size, coverage, salesRate }) {
  const getStatusColor = (months) => {
    if (months < 2) return '#ff4444'; // Red - critical
    if (months < 3) return '#ff8800'; // Orange - low
    if (months < 4) return '#ffbb00'; // Yellow - warning
    return '#44ff88'; // Green - healthy
  };

  const statusColor = getStatusColor(coverage);

  return (
    <div style={{
      background: '#1a1a1a',
      border: `2px solid ${statusColor}`,
      borderRadius: '8px',
      padding: '20px',
      minWidth: '200px'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
        {size}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: statusColor, marginBottom: '8px' }}>
        {coverage.toFixed(1)} months
      </div>
      <div style={{ fontSize: '14px', color: '#888', marginTop: '12px' }}>
        Sales: {salesRate.toFixed(1)} units/month
      </div>
    </div>
  );
}
