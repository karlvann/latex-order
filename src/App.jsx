import React, { useState, useMemo } from 'react';
import {
  SIZES,
  FIRMNESSES,
  DEFAULT_CONTAINER_SIZE,
  DEFAULT_INVENTORY,
  ANNUAL_REVENUE_OPTIONS,
  DEFAULT_ANNUAL_REVENUE,
  MATTRESS_AVERAGE_PRICE,
  getScaledUsageRates
} from './lib/constants';
import { calculateCoverageEqualizedOrder } from './lib/algorithms';
import OrderHero from './components/OrderHero';
import InventoryMix from './components/InventoryMix';
import HealthAlert from './components/HealthAlert';
import InventoryEditor from './components/InventoryEditor';
import ForecastTable from './components/ForecastTable';
import SaveLoadPanel from './components/SaveLoadPanel';

function App() {
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [containerSize, setContainerSize] = useState(DEFAULT_CONTAINER_SIZE);
  const [annualRevenue, setAnnualRevenue] = useState(DEFAULT_ANNUAL_REVENUE);

  // Calculate scaled usage rates based on selected annual revenue
  const usageRates = useMemo(() => {
    return getScaledUsageRates(annualRevenue);
  }, [annualRevenue]);

  // Calculate the recommended order using coverage-equalized algorithm
  const { order, metadata } = useMemo(() => {
    return calculateCoverageEqualizedOrder(inventory, containerSize, usageRates);
  }, [inventory, containerSize, usageRates]);


  const handleCopyOrder = () => {
    const lines = ['Recommended Latex Order (40-foot Container)', ''];
    lines.push(`Annual Target: $${(annualRevenue / 1000000).toFixed(2)}M ($${(usageRates.weeklyRevenue / 1000).toFixed(0)}K/week → ${usageRates.weeklyMattresses} mattresses/week)`);
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
    setAnnualRevenue(saveData.annualRevenue);
  };

  const formatAnnualRevenue = (value) => {
    const millions = value / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(2)}M`.replace('.00', '').replace(/(\.\d)0$/, '$1');
  };

  // Format dropdown option to show weekly revenue and mattresses
  const formatDropdownOption = (annualValue) => {
    const rates = getScaledUsageRates(annualValue);
    return `$${(rates.weeklyRevenue / 1000).toFixed(0)}K/wk → ${Math.round(rates.weeklyMattresses)} mattresses`;
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Latex Order Calculator</h1>
        <p style={styles.subtitle}>40-Foot Container | Coverage-Equalized Ordering</p>
      </header>

      <main style={styles.main}>
        {/* Save/Load Panel */}
        <SaveLoadPanel
          inventory={inventory}
          annualRevenue={annualRevenue}
          onLoad={handleLoadSave}
        />

        {/* Revenue Selector */}
        <div style={styles.revenueSection}>
          <div style={styles.revenueHeader}>
            <label style={styles.revenueLabel}>Weekly Sales</label>
            <div style={styles.revenueInfo}>
              = {formatAnnualRevenue(annualRevenue)}/year | {usageRates.TOTAL_MONTHLY_SALES} units/month
            </div>
          </div>
          <div style={styles.revenueSelector}>
            <select
              value={annualRevenue}
              onChange={(e) => setAnnualRevenue(parseInt(e.target.value))}
              style={styles.revenueDropdown}
            >
              {ANNUAL_REVENUE_OPTIONS.map(value => (
                <option key={value} value={value}>
                  {formatDropdownOption(value)}
                </option>
              ))}
            </select>
            <div style={styles.revenueNote}>
              @ ${MATTRESS_AVERAGE_PRICE.toLocaleString()} avg
            </div>
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

        {/* Hero Section - Recommended Order */}
        <OrderHero
          order={order}
          containerSize={containerSize}
          onContainerChange={setContainerSize}
          onCopyOrder={handleCopyOrder}
          onExportCSV={handleExportCSV}
        />

        {/* Inventory Editor */}
        <InventoryEditor
          inventory={inventory}
          onChange={setInventory}
        />

        {/* Inventory Mix - Coverage runway analysis */}
        <InventoryMix
          inventory={inventory}
          usageRates={usageRates}
        />
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
    background: '#09090b',
    color: '#fafafa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    padding: '32px 24px 24px',
    textAlign: 'center',
    borderBottom: '1px solid #27272a'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#71717a'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  revenueSection: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  revenueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  revenueLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fafafa'
  },
  revenueInfo: {
    fontSize: '14px',
    color: '#22c55e',
    fontWeight: '500'
  },
  revenueSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  revenueDropdown: {
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#0a0a0a',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    color: '#fafafa',
    cursor: 'pointer',
    minWidth: '260px'
  },
  revenueNote: {
    fontSize: '13px',
    color: '#71717a'
  },
  footer: {
    padding: '24px',
    textAlign: 'center',
    borderTop: '1px solid #27272a',
    color: '#52525b',
    fontSize: '12px'
  }
};

export default App;

