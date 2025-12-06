import React, { useState } from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS } from '../lib/constants';

export default function InventoryEditor({ inventory, onChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (firmness, size, value) => {
    // Validate input: non-negative integer
    const parsed = parseInt(value);
    const validated = isNaN(parsed) ? 0 : Math.max(0, parsed);

    const newInventory = {
      ...inventory,
      [firmness]: {
        ...inventory[firmness],
        [size]: validated
      }
    };
    onChange(newInventory);
  };

  const getTotalForSize = (size) => {
    return FIRMNESSES.reduce((sum, f) => sum + (inventory[f]?.[size] || 0), 0);
  };

  const getTotalForFirmness = (firmness) => {
    return SIZES.reduce((sum, s) => sum + (inventory[firmness]?.[s] || 0), 0);
  };

  const grandTotal = SIZES.reduce((sum, size) => sum + getTotalForSize(size), 0);

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <span style={styles.headerTitle}>
          {isExpanded ? '▼' : '▶'} Current Inventory
        </span>
        <span style={styles.headerTotal}>{grandTotal} pieces</span>
      </button>

      {isExpanded && (
        <div style={styles.content}>
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
              {FIRMNESSES.map(firmness => (
                <tr key={firmness}>
                  <td style={styles.tdLabel}>{FIRMNESS_LABELS[firmness]}</td>
                  {SIZES.map(size => (
                    <td key={size} style={styles.tdInput}>
                      <input
                        type="number"
                        min={0}
                        value={inventory[firmness]?.[size] ?? 0}
                        onChange={(e) => handleChange(firmness, size, e.target.value)}
                        style={styles.input}
                      />
                    </td>
                  ))}
                  <td style={styles.tdTotal}>{getTotalForFirmness(firmness)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={styles.tdLabel}><strong>Total</strong></td>
                {SIZES.map(size => (
                  <td key={size} style={styles.tdTotal}>{getTotalForSize(size)}</td>
                ))}
                <td style={styles.tdGrandTotal}>{grandTotal}</td>
              </tr>
            </tfoot>
          </table>

          <p style={styles.hint}>
            Edit values to update order recommendations in real-time.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#fafafa'
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '600'
  },
  headerTotal: {
    fontSize: '14px',
    color: '#a1a1aa'
  },
  content: {
    padding: '0 20px 20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '10px 12px',
    textAlign: 'center',
    color: '#71717a',
    fontWeight: '600',
    borderBottom: '1px solid #27272a',
    fontSize: '12px',
    textTransform: 'uppercase'
  },
  tdLabel: {
    padding: '10px 12px',
    color: '#a1a1aa',
    borderBottom: '1px solid #27272a'
  },
  tdInput: {
    padding: '8px 12px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a'
  },
  tdTotal: {
    padding: '10px 12px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    color: '#71717a',
    fontWeight: '500'
  },
  tdGrandTotal: {
    padding: '10px 12px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    color: '#3b82f6',
    fontWeight: '700'
  },
  input: {
    width: '70px',
    padding: '8px 10px',
    background: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: '#fafafa',
    textAlign: 'center',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  hint: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#52525b',
    fontStyle: 'italic'
  }
};
