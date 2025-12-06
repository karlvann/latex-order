import React from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, CRITICAL_THRESHOLD_MONTHS } from '../lib/constants';
import { getAllSKUCoverages, getTotalOrdered } from '../lib/algorithms';

// Decision Summary - Shows WHY this order makes sense with before/after coverage
export default function DecisionSummary({ inventory, order, usageRates = null }) {
  const coveragesBefore = getAllSKUCoverages(inventory, usageRates);
  const totalOrdered = getTotalOrdered(order);

  // Calculate after coverage (inventory + order)
  const inventoryAfter = {};
  for (const firmness of FIRMNESSES) {
    inventoryAfter[firmness] = {};
    for (const size of SIZES) {
      inventoryAfter[firmness][size] = (inventory[firmness]?.[size] || 0) + (order[firmness]?.[size] || 0);
    }
  }
  const coveragesAfter = getAllSKUCoverages(inventoryAfter, usageRates);

  // Find critical SKUs (before order)
  const criticalBefore = Object.entries(coveragesBefore)
    .filter(([_, cov]) => cov < CRITICAL_THRESHOLD_MONTHS)
    .sort((a, b) => a[1] - b[1]);

  // Find lowest coverage after order
  const lowestAfter = Object.entries(coveragesAfter)
    .sort((a, b) => a[1] - b[1])[0];

  // Calculate container breakdown
  const queenTotal = FIRMNESSES.reduce((sum, f) => sum + (order[f]?.Queen || 0), 0);
  const kingTotal = FIRMNESSES.reduce((sum, f) => sum + (order[f]?.King || 0), 0);
  const firmTotal = SIZES.reduce((sum, s) => sum + (order.firm?.[s] || 0), 0);
  const mediumTotal = SIZES.reduce((sum, s) => sum + (order.medium?.[s] || 0), 0);
  const softTotal = SIZES.reduce((sum, s) => sum + (order.soft?.[s] || 0), 0);

  const queenPct = totalOrdered > 0 ? Math.round((queenTotal / totalOrdered) * 100) : 0;
  const kingPct = totalOrdered > 0 ? Math.round((kingTotal / totalOrdered) * 100) : 0;
  const firmPct = totalOrdered > 0 ? Math.round((firmTotal / totalOrdered) * 100) : 0;
  const mediumPct = totalOrdered > 0 ? Math.round((mediumTotal / totalOrdered) * 100) : 0;
  const softPct = totalOrdered > 0 ? Math.round((softTotal / totalOrdered) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>📋</span>
        <span style={styles.headerTitle}>Order Summary</span>
      </div>

      {/* Before/After Coverage */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Coverage Change</div>
        <div style={styles.coverageGrid}>
          {criticalBefore.length > 0 ? (
            // Show critical SKUs that get fixed
            criticalBefore.slice(0, 4).map(([key, covBefore]) => {
              const [size, firmness] = key.split('_');
              const covAfter = coveragesAfter[key];
              const isFixed = covAfter >= CRITICAL_THRESHOLD_MONTHS;
              return (
                <div key={key} style={styles.coverageRow}>
                  <span style={styles.skuName}>{size} {firmness}</span>
                  <span style={styles.coverageChange}>
                    <span style={{ color: '#ef4444' }}>{covBefore.toFixed(1)}mo</span>
                    <span style={styles.arrow}> → </span>
                    <span style={{ color: isFixed ? '#22c55e' : '#eab308' }}>{covAfter.toFixed(1)}mo</span>
                  </span>
                </div>
              );
            })
          ) : (
            // All healthy - show general improvement
            <div style={styles.healthyMessage}>
              All SKUs already healthy. This order increases buffer stock.
            </div>
          )}
        </div>

        {/* Result summary */}
        {criticalBefore.length > 0 && (
          <div style={styles.resultBox}>
            <span style={styles.resultIcon}>✓</span>
            <span style={styles.resultText}>
              After order: All SKUs at {lowestAfter ? lowestAfter[1].toFixed(1) : '4+'}+ months coverage
            </span>
          </div>
        )}
      </div>

      {/* Container Breakdown */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Container Breakdown</div>

        {/* Size split */}
        <div style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>Size:</span>
          <div style={styles.barContainer}>
            <div style={{ ...styles.barSegment, width: `${queenPct}%`, background: '#3b82f6' }}>
              {queenPct > 15 && <span>Queen {queenPct}%</span>}
            </div>
            <div style={{ ...styles.barSegment, width: `${kingPct}%`, background: '#8b5cf6' }}>
              {kingPct > 15 && <span>King {kingPct}%</span>}
            </div>
          </div>
        </div>

        {/* Firmness split */}
        <div style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>Firmness:</span>
          <div style={styles.barContainer}>
            <div style={{ ...styles.barSegment, width: `${firmPct}%`, background: '#64748b' }}>
              {firmPct > 10 && <span>F {firmPct}%</span>}
            </div>
            <div style={{ ...styles.barSegment, width: `${mediumPct}%`, background: '#22c55e' }}>
              {mediumPct > 15 && <span>Med {mediumPct}%</span>}
            </div>
            <div style={{ ...styles.barSegment, width: `${softPct}%`, background: '#eab308' }}>
              {softPct > 15 && <span>Soft {softPct}%</span>}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#3b82f6'}}></span>Queen: {queenTotal}</span>
          <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#8b5cf6'}}></span>King: {kingTotal}</span>
          <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#64748b'}}></span>Firm: {firmTotal}</span>
          <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#22c55e'}}></span>Medium: {mediumTotal}</span>
          <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#eab308'}}></span>Soft: {softTotal}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  headerIcon: {
    fontSize: '20px'
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fafafa'
  },
  section: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '12px',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  coverageGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  coverageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#0a0a0a',
    borderRadius: '6px'
  },
  skuName: {
    fontSize: '13px',
    color: '#d4d4d8',
    fontWeight: '500'
  },
  coverageChange: {
    fontSize: '13px',
    fontFamily: 'monospace'
  },
  arrow: {
    color: '#71717a'
  },
  healthyMessage: {
    padding: '12px',
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '6px',
    color: '#86efac',
    fontSize: '13px'
  },
  resultBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    padding: '10px 12px',
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '6px'
  },
  resultIcon: {
    color: '#22c55e',
    fontSize: '16px'
  },
  resultText: {
    color: '#86efac',
    fontSize: '13px',
    fontWeight: '500'
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px'
  },
  breakdownLabel: {
    fontSize: '12px',
    color: '#a1a1aa',
    width: '70px',
    flexShrink: 0
  },
  barContainer: {
    flex: 1,
    display: 'flex',
    height: '24px',
    borderRadius: '4px',
    overflow: 'hidden',
    background: '#0a0a0a'
  },
  barSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    transition: 'width 0.3s'
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginTop: '8px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#a1a1aa'
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  }
};
