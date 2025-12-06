import React, { useState } from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, LEAD_TIME_MONTHS } from '../lib/constants';
import { calculateProjection } from '../lib/algorithms';

// ForecastTable - Shows 12-month stock projections

function getCellColor(value) {
  if (value < 0) return '#ef4444'; // Red - stockout
  if (value < 20) return '#f97316'; // Orange - critical
  if (value < 50) return '#eab308'; // Yellow - low
  return '#22c55e'; // Green - healthy
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ForecastTable({ inventory, order, usageRates = null }) {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default

  const today = new Date();
  const startMonth = today.getMonth();

  const getMonthLabel = (offset) => {
    if (offset === 0) return 'Now';
    return MONTH_NAMES[(startMonth + offset) % 12];
  };

  const projections = calculateProjection(inventory, order, 12, usageRates);

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.header}
      >
        <span style={styles.headerTitle}>
          {isExpanded ? '▼' : '▶'} 12-Month Forecast
        </span>
        <span style={styles.headerHint}>Container arrives month 3</span>
      </button>

      {isExpanded && (
        <div style={styles.content}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, position: 'sticky', left: 0, background: '#0a0a0a', zIndex: 2 }}>
                    SKU
                  </th>
                  {projections.map((_, idx) => (
                    <th
                      key={idx}
                      style={{
                        ...styles.th,
                        ...(idx === LEAD_TIME_MONTHS ? styles.arrivalHeader : {})
                      }}
                    >
                      {idx === LEAD_TIME_MONTHS ? '📦 ' : ''}
                      {getMonthLabel(idx)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZES.map(size => (
                  <React.Fragment key={size}>
                    {/* Size header row */}
                    <tr>
                      <td colSpan={projections.length + 1} style={styles.sizeHeader}>
                        {size}
                      </td>
                    </tr>
                    {/* Firmness rows */}
                    {FIRMNESSES.map(firmness => {
                      const key = `${size}_${firmness}`;
                      return (
                        <tr key={key}>
                          <td style={{ ...styles.tdLabel, position: 'sticky', left: 0, background: '#0a0a0a', zIndex: 1 }}>
                            {FIRMNESS_LABELS[firmness]}
                          </td>
                          {projections.map((monthData, idx) => {
                            const value = monthData[key];
                            const isArrival = idx === LEAD_TIME_MONTHS;
                            return (
                              <td
                                key={idx}
                                style={{
                                  ...styles.tdValue,
                                  color: getCellColor(value),
                                  ...(isArrival ? styles.arrivalCell : {})
                                }}
                              >
                                {value < 0 ? value : value}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#22c55e' }}></span>
              Healthy (50+)
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#eab308' }}></span>
              Low (20-49)
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#f97316' }}></span>
              Critical (&lt;20)
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: '#ef4444' }}></span>
              Stockout (&lt;0)
            </span>
          </div>
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
  headerHint: {
    fontSize: '12px',
    color: '#71717a'
  },
  content: {
    padding: '0 20px 20px'
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #27272a',
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    fontFamily: 'monospace'
  },
  th: {
    padding: '10px 8px',
    textAlign: 'center',
    color: '#a1a1aa',
    fontWeight: '600',
    borderBottom: '1px solid #27272a',
    whiteSpace: 'nowrap',
    minWidth: '50px'
  },
  arrivalHeader: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#60a5fa'
  },
  sizeHeader: {
    padding: '10px 12px',
    fontWeight: '700',
    fontSize: '13px',
    color: '#fafafa',
    background: '#18181b',
    borderBottom: '1px solid #27272a'
  },
  tdLabel: {
    padding: '8px 12px',
    color: '#a1a1aa',
    borderBottom: '1px solid #27272a',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  tdValue: {
    padding: '8px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a',
    fontWeight: '500'
  },
  arrivalCell: {
    background: 'rgba(59, 130, 246, 0.1)'
  },
  legend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '16px',
    fontSize: '12px',
    color: '#a1a1aa'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  }
};
