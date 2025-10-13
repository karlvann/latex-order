import React, { useState, useMemo } from 'react';
import SaveLoadModal from './SaveLoadModal';
import InventoryTable from './components/InventoryTable';
import CoverageCard from './components/CoverageCard';
import OrderSummary from './components/OrderSummary';
import SalesBreakdown from './components/SalesBreakdown';
import MonthlyForecastView from './views/MonthlyForecastView';
import WeeklyForecastView from './views/WeeklyForecastView';

// Import algorithms
import {
  calculateCoverage,
  calculateOrder,
  generateTSV,
  generateOrderSummary
} from './lib/algorithms';

// Import constants
import {
  DEFAULT_CONTAINER_SIZE,
  MIN_CONTAINER_SIZE,
  MAX_CONTAINER_SIZE,
  MONTHLY_SALES_RATE
} from './lib/constants';

// Import utilities
import { createEmptyInventory, getTotalUnits } from './lib/utils/inventory';

export default function App() {
  // State
  const [containerSize, setContainerSize] = useState(DEFAULT_CONTAINER_SIZE);
  const [inventory, setInventory] = useState(() => {
    // Initialize with spreadsheet data
    return {
      firm: { Queen: 29, King: 21 },
      medium: { Queen: 64, King: 33 },
      soft: { Queen: 47, King: 30 }
    };
  });

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [openSection, setOpenSection] = useState('inventory');
  const [currentView, setCurrentView] = useState('builder'); // 'builder', 'monthly', 'weekly'
  const [startingMonth, setStartingMonth] = useState(new Date().getMonth()); // 0-11
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Toggle section (accordion)
  const toggleSection = (sectionName) => {
    setOpenSection(openSection === sectionName ? null : sectionName);
  };

  // Calculate order
  const order = useMemo(() => {
    return calculateOrder(containerSize, inventory);
  }, [containerSize, inventory]);

  // Calculate coverage
  const coverageData = useMemo(() => {
    return {
      Queen: calculateCoverage(inventory, 'Queen'),
      King: calculateCoverage(inventory, 'King')
    };
  }, [inventory]);

  // Calculate post-order coverage
  const postOrderCoverage = useMemo(() => {
    const postOrderInventory = {
      firm: {
        Queen: inventory.firm.Queen + order.firm.Queen,
        King: inventory.firm.King + order.firm.King
      },
      medium: {
        Queen: inventory.medium.Queen + order.medium.Queen,
        King: inventory.medium.King + order.medium.King
      },
      soft: {
        Queen: inventory.soft.Queen + order.soft.Queen,
        King: inventory.soft.King + order.soft.King
      }
    };

    return {
      Queen: calculateCoverage(postOrderInventory, 'Queen'),
      King: calculateCoverage(postOrderInventory, 'King')
    };
  }, [inventory, order]);

  // TSV export
  const tsvContent = useMemo(() => {
    return generateTSV(order);
  }, [order]);

  // Order summary
  const orderSummary = useMemo(() => {
    return generateOrderSummary(order);
  }, [order]);

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(tsvContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Save/Load functions
  const getCurrentSaveData = () => ({
    inventory,
    settings: {
      containerSize
    }
  });

  const applyLoadedData = (data) => {
    if (data.inventory) {
      setInventory(data.inventory);
    }
    if (data.settings) {
      if (data.settings.containerSize !== undefined) {
        setContainerSize(data.settings.containerSize);
      }
    }
  };

  const currentTotal = getTotalUnits(inventory);
  const orderTotal = getTotalUnits(order);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #333',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Left: Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Latex Mattress Order System
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '14px' }}>
            Inventory Management & Container Planning
          </p>
        </div>

        {/* Right: View Tabs + Save/Load */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setCurrentView('builder')}
              style={{
                padding: '10px 20px',
                background: currentView === 'builder' ? '#4a9eff' : '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                color: currentView === 'builder' ? '#000' : '#fafafa',
                fontSize: '14px',
                fontWeight: currentView === 'builder' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Order Builder
            </button>
            <button
              onClick={() => setCurrentView('monthly')}
              style={{
                padding: '10px 20px',
                background: currentView === 'monthly' ? '#4a9eff' : '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                color: currentView === 'monthly' ? '#000' : '#fafafa',
                fontSize: '14px',
                fontWeight: currentView === 'monthly' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Forecast 1
            </button>
            <button
              onClick={() => setCurrentView('weekly')}
              style={{
                padding: '10px 20px',
                background: currentView === 'weekly' ? '#4a9eff' : '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                color: currentView === 'weekly' ? '#000' : '#fafafa',
                fontSize: '14px',
                fontWeight: currentView === 'weekly' ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              Forecast 2
            </button>
          </div>

          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              padding: '10px 20px',
              background: '#166534',
              border: 'none',
              borderRadius: '6px',
              color: '#86efac',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>💾</span>
            <span>Save/Load</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      {currentView === 'builder' && (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Container Size */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('containerSize')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Container Size</span>
              <span>{openSection === 'containerSize' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'containerSize' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <input
                    type="range"
                    min={MIN_CONTAINER_SIZE}
                    max={MAX_CONTAINER_SIZE}
                    value={containerSize}
                    onChange={(e) => setContainerSize(parseInt(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min={MIN_CONTAINER_SIZE}
                    max={MAX_CONTAINER_SIZE}
                    value={containerSize}
                    onChange={(e) => setContainerSize(parseInt(e.target.value) || DEFAULT_CONTAINER_SIZE)}
                    style={{
                      width: '100px',
                      padding: '8px',
                      background: '#1a1a1a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fafafa',
                      fontSize: '16px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                  />
                  <span>units</span>
                </div>
              </div>
            )}
          </section>

          {/* Sales & Usage Breakdown */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('salesBreakdown')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Sales & Usage Breakdown (80 pieces/month • 18.5/week)</span>
              <span>{openSection === 'salesBreakdown' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'salesBreakdown' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <SalesBreakdown />
              </div>
            )}
          </section>

          {/* Current Inventory */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('inventory')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Current Inventory ({currentTotal} units)</span>
              <span>{openSection === 'inventory' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'inventory' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <InventoryTable inventory={inventory} onChange={setInventory} />
              </div>
            )}
          </section>

          {/* Current Coverage */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('coverage')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Current Coverage</span>
              <span>{openSection === 'coverage' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'coverage' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <CoverageCard
                    size="Queen"
                    coverage={coverageData.Queen}
                    salesRate={MONTHLY_SALES_RATE.Queen}
                  />
                  <CoverageCard
                    size="King"
                    coverage={coverageData.King}
                    salesRate={MONTHLY_SALES_RATE.King}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Your Order */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('order')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Your Order ({orderTotal} units)</span>
              <span>{openSection === 'order' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'order' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <OrderSummary order={order} inventory={inventory} />
              </div>
            )}
          </section>

          {/* Coverage After Order */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('postCoverage')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Coverage After Order</span>
              <span>{openSection === 'postCoverage' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'postCoverage' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <CoverageCard
                    size="Queen"
                    coverage={postOrderCoverage.Queen}
                    salesRate={MONTHLY_SALES_RATE.Queen}
                  />
                  <CoverageCard
                    size="King"
                    coverage={postOrderCoverage.King}
                    salesRate={MONTHLY_SALES_RATE.King}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Export */}
          <section style={{
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            marginBottom: '20px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleSection('export')}
              style={{
                width: '100%',
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                color: '#fafafa',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Export Order</span>
              <span>{openSection === 'export' ? '▼' : '▶'}</span>
            </button>
            {openSection === 'export' && (
              <div style={{ padding: '20px', borderTop: '1px solid #333' }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '12px 24px',
                    background: '#4a9eff',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  {copyFeedback ? '✓ Copied!' : 'Copy to Clipboard'}
                </button>
                <pre style={{
                  background: '#1a1a1a',
                  padding: '16px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  border: '1px solid #333'
                }}>
                  {tsvContent}
                </pre>
              </div>
            )}
          </section>
        </div>
      )}

      {currentView === 'monthly' && (
        <MonthlyForecastView
          startingMonth={startingMonth}
          setStartingMonth={setStartingMonth}
          inventory={inventory}
          order={order}
        />
      )}

      {currentView === 'weekly' && (
        <WeeklyForecastView
          startingMonth={startingMonth}
          setStartingMonth={setStartingMonth}
          inventory={inventory}
          order={order}
        />
      )}

      {/* Save/Load Modal */}
      <SaveLoadModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentData={getCurrentSaveData()}
        onLoad={applyLoadedData}
      />
    </div>
  );
}
