import React, { useState, useMemo, useEffect } from 'react';
import {
  SIZES,
  FIRMNESSES,
  DEFAULT_CONTAINER_SIZE,
  DEFAULT_INVENTORY,
  DEFAULT_USAGE_RATES
} from './lib/constants';
import { calculateCoverageEqualizedOrder } from './lib/algorithms';
import OrderHero from './components/OrderHero';
import InventoryMix from './components/InventoryMix';
import HealthAlert from './components/HealthAlert';
import ForecastTable from './components/ForecastTable';
import SaveLoadPanel from './components/SaveLoadPanel';
import DecisionSummary from './components/DecisionSummary';

function App() {
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [containerSize, setContainerSize] = useState(DEFAULT_CONTAINER_SIZE);
  const [usageRates, setUsageRates] = useState(DEFAULT_USAGE_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSave, setCurrentSave] = useState(null);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // Fetch inventory and sales data from Directus
  const fetchDirectusData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/directus?' + Date.now());
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();

      if (data.inventory) {
        setInventory(data.inventory);
      }

      if (data.sales?.monthlyUsage) {
        // Transform from [firmness][size] to [size][firmness] format expected by algorithms
        const monthlyUsage = data.sales.monthlyUsage;
        const SKU_MONTHLY_USAGE = {
          Queen: {
            firm: monthlyUsage.firm?.Queen || 0,
            medium: monthlyUsage.medium?.Queen || 0,
            soft: monthlyUsage.soft?.Queen || 0
          },
          King: {
            firm: monthlyUsage.firm?.King || 0,
            medium: monthlyUsage.medium?.King || 0,
            soft: monthlyUsage.soft?.King || 0
          }
        };

        const totalMonthly =
          Object.values(SKU_MONTHLY_USAGE).reduce((sum, size) =>
            sum + Object.values(size).reduce((s, v) => s + v, 0), 0);

        setUsageRates({
          SKU_MONTHLY_USAGE,
          TOTAL_MONTHLY_SALES: totalMonthly,
          periodDays: data.sales.periodDays || 60,
          rawCounts: data.sales.rawCounts
        });
      }

      setLastFetched(new Date());
    } catch (err) {
      console.error('Failed to fetch from Directus:', err);
      setError(err.message);
    }
    setIsLoading(false);
  };

  // Fetch on mount
  useEffect(() => {
    fetchDirectusData();
  }, []);

  // Calculate the recommended order using coverage-equalized algorithm
  const { order, metadata } = useMemo(() => {
    return calculateCoverageEqualizedOrder(inventory, containerSize, usageRates);
  }, [inventory, containerSize, usageRates]);


  const handleCopyOrder = () => {
    const lines = ['Recommended Latex Order (40-foot Container)', ''];
    lines.push(`Based on ${usageRates.periodDays || 60}-day sales lookback`);
    lines.push(`Monthly demand: ${usageRates.TOTAL_MONTHLY_SALES?.toFixed(1) || 'N/A'} units`);
    lines.push('');

    FIRMNESSES.forEach(firmness => {
      SIZES.forEach(size => {
        const qty = order[firmness]?.[size] || 0;
        if (qty > 0) {
          lines.push(`${size} ${firmness}: ${qty}`);
        }
      });
    });

    const total = FIRMNESSES.reduce((sum, f) =>
      sum + SIZES.reduce((s, sz) => s + (order[f]?.[sz] || 0), 0), 0);

    lines.push('', `Total: ${total} pieces`);

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Order copied to clipboard!');
  };

  const handleExportCSV = () => {
    const rows = [['Firmness', 'Size', 'Quantity']];

    FIRMNESSES.forEach(firmness => {
      SIZES.forEach(size => {
        const qty = order[firmness]?.[size] || 0;
        rows.push([firmness, size, qty.toString()]);
      });
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latex-order-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSave = (saveData) => {
    setInventory(saveData.inventory);
    if (saveData.usageRates) {
      setUsageRates(saveData.usageRates);
    }
    if (saveData.name && saveData.date) {
      setCurrentSave({ name: saveData.name, date: saveData.date });
    }
  };

  const formatLastFetched = () => {
    if (!lastFetched) return '';
    return lastFetched.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <div style={styles.brandRow}>
            <span style={styles.brandName}>AusBeds</span>
            <span style={styles.brandDivider}>|</span>
            <span style={styles.countryBadge}>SRI LANKA</span>
            <span style={styles.brandDivider}>|</span>
            <span style={styles.appName}>Latex Order</span>
          </div>
          <div style={styles.subtitle}>40-Foot Container | Coverage-Equalized Ordering</div>
        </div>

        <div style={styles.headerActions}>
          {lastFetched && (
            <div style={styles.syncIndicator}>
              <span style={styles.syncDot}></span>
              <span style={styles.syncText}>Synced {formatLastFetched()}</span>
              <button onClick={fetchDirectusData} style={styles.refreshButton} title="Refresh data">
                ↻
              </button>
            </div>
          )}
          {currentSave && (
            <div style={styles.currentSaveIndicator}>
              <span style={styles.currentSaveName}>{currentSave.name}</span>
            </div>
          )}
          <button
            onClick={() => setShowSavePanel(!showSavePanel)}
            style={styles.saveButton}
          >
            <span>💾</span>
            <span>Save/Load</span>
          </button>
        </div>
      </header>

      {/* Save/Load Panel - Slides down from header */}
      {showSavePanel && (
        <div style={styles.savePanelContainer}>
          <SaveLoadPanel
            inventory={inventory}
            usageRates={usageRates}
            onLoad={handleLoadSave}
            currentSave={currentSave}
            onSaveCreated={(save) => setCurrentSave({ name: save.name, date: save.created_at })}
          />
        </div>
      )}

      <main style={styles.main}>
        {/* Error Display */}
        {error && (
          <div style={styles.errorBanner}>
            <span>Failed to fetch live data: {error}</span>
            <button onClick={fetchDirectusData} style={styles.retryButton}>Retry</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Fetching inventory and sales data...</p>
          </div>
        ) : (
          <>
            {/* Demand Summary - Shows actual sales data */}
            <div style={styles.demandSection}>
              <div style={styles.demandHeader}>
                <label style={styles.demandLabel}>Demand (42-Day Lookback)</label>
                <div style={styles.demandInfo}>
                  {usageRates.TOTAL_MONTHLY_SALES?.toFixed(1) || 0} units/month
                </div>
              </div>
              <div style={styles.demandGrid}>
                {FIRMNESSES.map(firmness => (
                  <div key={firmness} style={styles.demandCard}>
                    <div style={styles.demandCardTitle}>{firmness}</div>
                    <div style={styles.demandCardStats}>
                      <span>Q: {usageRates.SKU_MONTHLY_USAGE?.Queen?.[firmness]?.toFixed(1) || 0}/mo</span>
                      <span>K: {usageRates.SKU_MONTHLY_USAGE?.King?.[firmness]?.toFixed(1) || 0}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12-Month Forecast - Primary view */}
            <ForecastTable
              inventory={inventory}
              order={order}
              usageRates={usageRates}
            />

            {/* Health Alert - Shows overall inventory status */}
            <HealthAlert inventory={inventory} order={order} usageRates={usageRates} />

            {/* Decision Summary - Shows WHY this order with before/after coverage */}
            <DecisionSummary inventory={inventory} order={order} usageRates={usageRates} />

            {/* Hero Section - Recommended Order */}
            <OrderHero
              order={order}
              containerSize={containerSize}
              onContainerChange={setContainerSize}
              onCopyOrder={handleCopyOrder}
              onExportCSV={handleExportCSV}
            />

            {/* Current Inventory Display (read-only) */}
            <div style={styles.inventoryDisplay}>
              <div style={styles.inventoryHeader}>
                <span style={styles.inventoryTitle}>Current Inventory</span>
                <span style={styles.inventoryTotal}>
                  {FIRMNESSES.reduce((sum, f) =>
                    sum + SIZES.reduce((s, sz) => s + (inventory[f]?.[sz] || 0), 0), 0)} pieces
                </span>
              </div>
              <div style={styles.inventoryGrid}>
                {FIRMNESSES.map(firmness => (
                  <div key={firmness} style={styles.inventoryCard}>
                    <div style={styles.inventoryCardTitle}>{firmness}</div>
                    <div style={styles.inventoryCardStats}>
                      <div style={styles.inventoryStat}>
                        <span style={styles.inventoryStatLabel}>Queen</span>
                        <span style={styles.inventoryStatValue}>{inventory[firmness]?.Queen || 0}</span>
                      </div>
                      <div style={styles.inventoryStat}>
                        <span style={styles.inventoryStatLabel}>King</span>
                        <span style={styles.inventoryStatValue}>{inventory[firmness]?.King || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p style={styles.inventoryNote}>Data synced from Directus CMS</p>
            </div>

            {/* Inventory Mix - Coverage runway analysis */}
            <InventoryMix
              inventory={inventory}
              usageRates={usageRates}
            />
          </>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Algorithm: Coverage-Equalized Ordering | Lead Time: 3 months | Safety Buffer: 1 month</p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0b',
    color: '#e5e5e5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    position: 'sticky',
    top: 0,
    height: '64px',
    background: 'rgba(17, 17, 19, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #1f1f23',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '2px'
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#d97706',
    letterSpacing: '-0.3px'
  },
  brandDivider: {
    fontSize: '18px',
    color: '#3f3f46',
    fontWeight: '300'
  },
  countryBadge: {
    padding: '3px 10px',
    background: 'rgba(217, 119, 6, 0.2)',
    border: '1px solid rgba(217, 119, 6, 0.4)',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    color: '#fbbf24'
  },
  appName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#e5e5e5',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    margin: 0,
    fontSize: '11px',
    color: '#71717a'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  syncIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    borderRadius: '6px'
  },
  syncDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e'
  },
  syncText: {
    fontSize: '12px',
    color: '#86efac'
  },
  refreshButton: {
    background: 'none',
    border: 'none',
    color: '#86efac',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0 4px'
  },
  currentSaveIndicator: {
    padding: '6px 12px',
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '6px'
  },
  currentSaveName: {
    fontSize: '12px',
    color: '#93c5fd',
    fontWeight: '500'
  },
  saveButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #27272a',
    fontWeight: '600',
    cursor: 'pointer',
    background: '#18181b',
    color: '#fbbf24',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px'
  },
  savePanelContainer: {
    background: '#18181b',
    borderBottom: '1px solid #27272a',
    padding: '16px 24px'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  errorBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '24px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#fca5a5'
  },
  retryButton: {
    padding: '6px 12px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '4px',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: '13px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #27272a',
    borderTop: '3px solid #d97706',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#71717a',
    fontSize: '14px'
  },
  demandSection: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  demandHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  demandLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fafafa'
  },
  demandInfo: {
    fontSize: '14px',
    color: '#22c55e',
    fontWeight: '500'
  },
  demandGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  demandCard: {
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '8px',
    padding: '12px'
  },
  demandCardTitle: {
    fontSize: '12px',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  demandCardStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#d4d4d8'
  },
  inventoryDisplay: {
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px'
  },
  inventoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  inventoryTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#fafafa'
  },
  inventoryTotal: {
    fontSize: '14px',
    color: '#a1a1aa'
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  inventoryCard: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    padding: '12px'
  },
  inventoryCardTitle: {
    fontSize: '12px',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  inventoryCardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  inventoryStat: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px'
  },
  inventoryStatLabel: {
    color: '#a1a1aa'
  },
  inventoryStatValue: {
    color: '#fafafa',
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  inventoryNote: {
    marginTop: '12px',
    fontSize: '11px',
    color: '#52525b',
    fontStyle: 'italic'
  },
  footer: {
    padding: '24px',
    textAlign: 'center',
    borderTop: '1px solid #27272a',
    color: '#a1a1aa',
    fontSize: '13px'
  }
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
