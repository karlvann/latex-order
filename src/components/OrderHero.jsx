import React from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS } from '../lib/constants';
import { getTotalOrdered } from '../lib/algorithms';

export default function OrderHero({ order, containerSize, onContainerChange, onCopyOrder, onExportCSV }) {
  const totalOrdered = getTotalOrdered(order);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Recommended Order</h2>
        <div style={styles.totalBadge}>
          {totalOrdered} units
        </div>
      </div>

      {/* Container Size Slider */}
      <div style={styles.sliderSection}>
        <label style={styles.sliderLabel}>
          Container Size: <strong>{containerSize}</strong> pieces
        </label>
        <input
          type="range"
          min={100}
          max={500}
          step={10}
          value={containerSize}
          onChange={(e) => onContainerChange(parseInt(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.sliderMarks}>
          <span>100</span>
          <span>200</span>
          <span>300</span>
          <span>400</span>
          <span>500</span>
        </div>
      </div>

      {/* Order Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              {SIZES.map(size => (
                <th key={size} style={styles.th}>{size}</th>
              ))}
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {FIRMNESSES.map(firmness => {
              const rowTotal = SIZES.reduce((sum, size) => sum + (order[firmness]?.[size] || 0), 0);
              return (
                <tr key={firmness}>
                  <td style={styles.tdLabel}>{FIRMNESS_LABELS[firmness]}</td>
                  {SIZES.map(size => {
                    const qty = order[firmness]?.[size] || 0;
                    return (
                      <td key={size} style={styles.tdValue}>
                        {qty > 0 ? (
                          <span style={styles.orderQty}>+{qty}</span>
                        ) : (
                          <span style={styles.orderZero}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={styles.tdTotal}>{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={styles.tdLabel}><strong>Total</strong></td>
              {SIZES.map(size => {
                const colTotal = FIRMNESSES.reduce((sum, f) => sum + (order[f]?.[size] || 0), 0);
                return <td key={size} style={styles.tdTotal}>{colTotal}</td>;
              })}
              <td style={styles.tdGrandTotal}>{totalOrdered}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button onClick={onCopyOrder} style={styles.primaryBtn}>
          Copy to Clipboard
        </button>
        <button onClick={onExportCSV} style={styles.secondaryBtn}>
          Export CSV
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '2px solid #3b82f6',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#fafafa'
  },
  totalBadge: {
    background: '#22c55e',
    color: '#000',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '18px',
    fontWeight: '700'
  },
  sliderSection: {
    marginBottom: '24px'
  },
  sliderLabel: {
    display: 'block',
    color: '#a1a1aa',
    marginBottom: '12px',
    fontSize: '14px'
  },
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#27272a',
    cursor: 'pointer',
    accentColor: '#3b82f6'
  },
  sliderMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#71717a',
    fontSize: '11px',
    marginTop: '6px'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '24px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'center',
    color: '#a1a1aa',
    fontWeight: '600',
    borderBottom: '2px solid #27272a',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.5px'
  },
  tdLabel: {
    padding: '14px 16px',
    color: '#d4d4d8',
    borderBottom: '1px solid #27272a',
    fontWeight: '500'
  },
  tdValue: {
    padding: '14px 16px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    fontFamily: 'monospace',
    fontSize: '16px'
  },
  tdTotal: {
    padding: '14px 16px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    color: '#a1a1aa',
    fontWeight: '600'
  },
  tdGrandTotal: {
    padding: '14px 16px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    color: '#22c55e',
    fontWeight: '700',
    fontSize: '18px'
  },
  orderQty: {
    color: '#22c55e',
    fontWeight: '700'
  },
  orderZero: {
    color: '#52525b'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    flex: 1,
    minWidth: '160px',
    padding: '14px 24px',
    background: '#22c55e',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  secondaryBtn: {
    flex: 1,
    minWidth: '160px',
    padding: '14px 24px',
    background: 'transparent',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    color: '#3b82f6',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
