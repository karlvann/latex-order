import React from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, CRITICAL_THRESHOLD_MONTHS } from '../lib/constants';
import { calculateSKUCoverage } from '../lib/algorithms';

function getStatusInfo(coverage) {
  if (coverage < 2) return { color: '#ef4444', label: 'CRITICAL', icon: '🔴' };
  if (coverage < 3) return { color: '#f97316', label: 'LOW', icon: '⚠️' };
  if (coverage < CRITICAL_THRESHOLD_MONTHS) return { color: '#eab308', label: 'WARNING', icon: '⚠️' };
  if (coverage > 8) return { color: '#3b82f6', label: 'OVER', icon: '▲' };
  return { color: '#22c55e', label: 'OK', icon: '✓' };
}

export default function InventoryMix({ inventory, usageRates }) {
  // Calculate coverage for all SKUs
  const skuData = [];
  let totalStock = 0;

  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const stock = inventory[firmness]?.[size] ?? 0;
      const coverage = calculateSKUCoverage(stock, size, firmness, usageRates);
      const monthlyUsage = usageRates?.SKU_MONTHLY_USAGE?.[size]?.[firmness] ?? 0;

      skuData.push({
        size,
        firmness,
        stock,
        coverage,
        monthlyUsage,
        key: `${size}_${firmness}`
      });
      totalStock += stock;
    }
  }

  // Sort by coverage (lowest first - most urgent)
  const sortedData = [...skuData].sort((a, b) => a.coverage - b.coverage);

  // Find issues
  const critical = sortedData.filter(s => s.coverage < CRITICAL_THRESHOLD_MONTHS);
  const overstocked = sortedData.filter(s => s.coverage > 8);

  // Max coverage for bar scaling (cap at 12 months for display)
  const maxCoverage = 12;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Stock Runway</h3>
        <div style={styles.targetLine}>
          Target: {CRITICAL_THRESHOLD_MONTHS} months
        </div>
      </div>

      <div style={styles.barList}>
        {skuData.map(({ size, firmness, stock, coverage, monthlyUsage, key }) => {
          const status = getStatusInfo(coverage);
          const barWidth = Math.min(100, (coverage / maxCoverage) * 100);
          const targetPosition = (CRITICAL_THRESHOLD_MONTHS / maxCoverage) * 100;

          return (
            <div key={key} style={styles.row}>
              <div style={styles.label}>
                <span style={styles.sizeName}>{size}</span>
                <span style={styles.firmnessName}>{FIRMNESS_LABELS[firmness]}</span>
              </div>

              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.targetMarker,
                    left: `${targetPosition}%`
                  }}
                />
                <div
                  style={{
                    ...styles.bar,
                    width: `${barWidth}%`,
                    background: status.color
                  }}
                />
              </div>

              <div style={styles.stats}>
                <span style={{ ...styles.coverage, color: status.color }}>
                  {coverage > 99 ? '99+' : coverage.toFixed(1)} mo
                </span>
                <span style={{ ...styles.status, color: status.color }}>
                  {status.icon}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {(critical.length > 0 || overstocked.length > 0) && (
        <div style={styles.insights}>
          {critical.length > 0 && (
            <div style={styles.insightRow}>
              <span style={styles.insightIcon}>🔴</span>
              <span style={styles.insightText}>
                <strong>Will run out before container:</strong>{' '}
                {critical.map(s => `${s.size} ${s.firmness} (${s.coverage.toFixed(1)}mo)`).join(', ')}
              </span>
            </div>
          )}
          {overstocked.length > 0 && (
            <div style={styles.insightRow}>
              <span style={styles.insightIcon}>▲</span>
              <span style={styles.insightText}>
                <strong>Overstocked:</strong>{' '}
                {overstocked.map(s => `${s.size} ${s.firmness} (${s.coverage.toFixed(1)}mo)`).join(', ')}
                {overstocked.some(s => s.firmness === 'firm') &&
                  ' — Firm sells slowly (5% of demand)'}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={styles.footer}>
        <span>Total: {totalStock} units in stock</span>
        <span style={styles.footerNote}>Lead time: 3 months | Buffer: 1 month</span>
      </div>

      {/* Demand Breakdown Card */}
      <DemandBreakdown usageRates={usageRates} />
    </div>
  );
}

function DemandBreakdown({ usageRates }) {
  const totalMonthly = usageRates?.TOTAL_MONTHLY_SALES ?? 0;
  const totalWeekly = totalMonthly / 4.33; // Convert monthly to weekly

  // Build table data for all variations
  const variations = [];
  for (const size of SIZES) {
    for (const firmness of FIRMNESSES) {
      const monthlyUnits = usageRates?.SKU_MONTHLY_USAGE?.[size]?.[firmness] ?? 0;
      const weeklyUnits = monthlyUnits / 4.33;
      const pct = totalMonthly > 0 ? (monthlyUnits / totalMonthly) * 100 : 0;
      variations.push({
        size,
        firmness,
        weeklyUnits,
        pct
      });
    }
  }

  return (
    <div style={demandStyles.container}>
      <div style={demandStyles.header}>
        <h3 style={demandStyles.title}>Demand Breakdown</h3>
        <div style={demandStyles.badge}>
          {totalWeekly.toFixed(1)}/wk total
        </div>
      </div>

      {/* Table */}
      <table style={demandStyles.table}>
        <thead>
          <tr>
            <th style={demandStyles.th}>Variation</th>
            <th style={demandStyles.thRight}>Units/Wk</th>
            <th style={demandStyles.thRight}>%</th>
          </tr>
        </thead>
        <tbody>
          {variations.map(({ size, firmness, weeklyUnits, pct }) => (
            <tr key={`${size}_${firmness}`} style={demandStyles.tr}>
              <td style={demandStyles.td}>
                <span style={demandStyles.sizeBadge}>{size}</span>
                <span style={demandStyles.firmnessBadge}>{firmness.charAt(0).toUpperCase() + firmness.slice(1)}</span>
              </td>
              <td style={demandStyles.tdRight}>
                {weeklyUnits.toFixed(1)}
              </td>
              <td style={demandStyles.tdRight}>
                {pct.toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const demandStyles = {
  container: {
    marginTop: '24px',
    padding: '16px',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    maxWidth: '320px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  title: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#22c55e',
    padding: '3px 8px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '4px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #27272a',
    textAlign: 'left'
  },
  thRight: {
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #27272a',
    textAlign: 'right',
    width: '70px'
  },
  tr: {
    borderBottom: '1px solid #27272a'
  },
  td: {
    padding: '8px',
    fontSize: '13px',
    color: '#fafafa'
  },
  tdRight: {
    padding: '8px',
    fontSize: '13px',
    color: '#fafafa',
    textAlign: 'right',
    fontFamily: 'monospace'
  },
  sizeBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#fafafa',
    background: '#3b82f6',
    borderRadius: '3px',
    marginRight: '6px'
  },
  firmnessBadge: {
    fontSize: '12px',
    color: '#a1a1aa'
  }
};

const styles = {
  container: {
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#fafafa'
  },
  targetLine: {
    fontSize: '12px',
    color: '#71717a',
    padding: '4px 8px',
    background: '#18181b',
    borderRadius: '4px'
  },
  barList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  label: {
    width: '140px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  sizeName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fafafa'
  },
  firmnessName: {
    fontSize: '11px',
    color: '#71717a'
  },
  barContainer: {
    flex: 1,
    height: '20px',
    background: '#18181b',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  targetMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    background: '#fafafa',
    opacity: 0.3,
    zIndex: 1
  },
  stats: {
    width: '80px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  coverage: {
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  status: {
    fontSize: '12px'
  },
  insights: {
    marginTop: '16px',
    padding: '12px',
    background: '#18181b',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  insightRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px'
  },
  insightIcon: {
    fontSize: '12px',
    flexShrink: 0
  },
  insightText: {
    fontSize: '12px',
    color: '#a1a1aa',
    lineHeight: '1.4'
  },
  footer: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #27272a',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#71717a'
  },
  footerNote: {
    color: '#52525b'
  }
};
