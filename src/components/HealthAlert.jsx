import React from 'react';
import { SIZES, FIRMNESSES, FIRMNESS_LABELS, COVERAGE_THRESHOLDS } from '../lib/constants';
import { findFirstStockout, calculateProjection, getAllSKUCoverages } from '../lib/algorithms';

export default function HealthAlert({ inventory, order, usageRates = null }) {
  const projections = calculateProjection(inventory, order, 12, usageRates);
  const firstStockout = findFirstStockout(projections);
  const coverages = getAllSKUCoverages(inventory, usageRates);

  // Find critical SKUs (< 2 months coverage)
  const criticalSKUs = Object.entries(coverages)
    .filter(([_, cov]) => cov < COVERAGE_THRESHOLDS.CRITICAL)
    .sort((a, b) => a[1] - b[1]);

  // Determine overall status
  let status, statusColor, statusBg, message, icon;

  if (firstStockout && firstStockout.month <= 3) {
    // Stockout before container arrives
    status = 'CRITICAL';
    statusColor = '#ef4444';
    statusBg = 'rgba(239, 68, 68, 0.1)';
    icon = '🚨';
    const [size, firmness] = [firstStockout.size, firstStockout.firmness];
    message = `${size} ${FIRMNESS_LABELS[firmness]} runs out in month ${firstStockout.month} — before container arrives!`;
  } else if (criticalSKUs.length > 0) {
    // Some SKUs critically low
    status = 'WARNING';
    statusColor = '#f97316';
    statusBg = 'rgba(249, 115, 22, 0.1)';
    icon = '⚠️';
    message = `${criticalSKUs.length} SKU${criticalSKUs.length > 1 ? 's' : ''} below 2 months coverage. Order recommended.`;
  } else if (firstStockout) {
    // Stockout after container but within forecast
    status = 'CAUTION';
    statusColor = '#eab308';
    statusBg = 'rgba(234, 179, 8, 0.1)';
    icon = '📊';
    message = `Projected stockout at month ${firstStockout.month}. Consider ordering larger container.`;
  } else {
    // All healthy
    status = 'HEALTHY';
    statusColor = '#22c55e';
    statusBg = 'rgba(34, 197, 94, 0.1)';
    icon = '✓';
    message = 'All SKUs have adequate coverage through the forecast period.';
  }

  return (
    <div style={{ ...styles.container, background: statusBg, borderColor: statusColor }}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>{icon}</span>
        </div>
        <div style={styles.textContent}>
          <div style={{ ...styles.status, color: statusColor }}>{status}</div>
          <div style={styles.message}>{message}</div>
        </div>
      </div>

      {criticalSKUs.length > 0 && (
        <div style={styles.details}>
          <div style={styles.detailsTitle}>Critical SKUs:</div>
          <div style={styles.skuList}>
            {criticalSKUs.slice(0, 3).map(([key, coverage]) => {
              const [size, firmness] = key.split('_');
              return (
                <span key={key} style={styles.skuBadge}>
                  {size} {firmness}: {coverage.toFixed(1)}mo
                </span>
              );
            })}
            {criticalSKUs.length > 3 && (
              <span style={styles.moreText}>+{criticalSKUs.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    border: '2px solid',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  iconWrapper: {
    flexShrink: 0
  },
  icon: {
    fontSize: '28px'
  },
  textContent: {
    flex: 1
  },
  status: {
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  message: {
    fontSize: '15px',
    color: '#d4d4d8',
    lineHeight: '1.4'
  },
  details: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  detailsTitle: {
    fontSize: '12px',
    color: '#71717a',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  skuList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  skuBadge: {
    fontSize: '12px',
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '4px',
    color: '#fafafa'
  },
  moreText: {
    fontSize: '12px',
    color: '#71717a',
    alignSelf: 'center'
  }
};
