import React, { useState, useEffect, useCallback } from 'react';
import { FIRMNESSES, SIZES, DEFAULT_ANNUAL_REVENUE } from '../lib/constants';

function SaveLoadPanel({ inventory, annualRevenue, onLoad, currentSave, onSaveCreated }) {
  const [saves, setSaves] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const fetchSaves = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/saves');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load saves');
      }
      const data = await res.json();
      setSaves(data);
    } catch (err) {
      console.error('Failed to fetch saves:', err);
      setError('Could not load saves. Check your connection.');
    }
  }, []);

  // Fetch saves when panel opens
  useEffect(() => {
    if (showPanel) {
      fetchSaves();
    }
  }, [showPanel, fetchSaves]);

  const handleSave = async () => {
    if (!saveName.trim()) {
      setError('Please enter a name for this save');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          inventory,
          annualRevenue
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      const result = await res.json();
      setSaveName('');
      setError(null);
      if (onSaveCreated && result) {
        onSaveCreated(result);
      }
      fetchSaves();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save. Try again.');
    }
    setLoading(false);
  };

  const handleLoad = (save) => {
    // Validate save data before loading
    if (!save.inventory || typeof save.inventory !== 'object') {
      setError('Invalid save data');
      return;
    }

    // Check structure
    const hasValidStructure = FIRMNESSES.every(f =>
      save.inventory[f] &&
      SIZES.every(s => typeof save.inventory[f][s] === 'number')
    );

    if (!hasValidStructure) {
      setError('Save data has invalid structure');
      return;
    }

    onLoad({
      inventory: save.inventory,
      annualRevenue: save.annual_revenue || DEFAULT_ANNUAL_REVENUE,
      name: save.name,
      date: save.created_at
    });
    setShowPanel(false);
    setError(null);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this save?')) return;

    setError(null);
    try {
      const res = await fetch(`/api/saves?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      fetchSaves();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete. Try again.');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRevenue = (value) => {
    if (!value) return '';
    const millions = value / 1000000;
    return `$${millions.toFixed(1)}M`;
  };

  const formatSaveDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <button
          onClick={() => setShowPanel(!showPanel)}
          style={styles.toggleButton}
        >
          {showPanel ? 'Close' : 'Save / Load'}
        </button>

        {currentSave && (
          <div style={styles.currentSave}>
            <span style={styles.currentSaveName}>{currentSave.name}</span>
            <span style={styles.currentSaveDate}>{formatSaveDate(currentSave.date)}</span>
          </div>
        )}
      </div>

      {showPanel && (
        <div style={styles.panel}>
          {/* Error Display */}
          {error && (
            <div style={styles.error}>
              {error}
              <button onClick={() => setError(null)} style={styles.errorClose}>×</button>
            </div>
          )}

          {/* Save Section */}
          <div style={styles.saveSection}>
            <input
              type="text"
              placeholder="e.g. Dec 6 - Koala restock"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={styles.input}
              maxLength={255}
            />
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                ...styles.saveButton,
                ...(loading ? styles.saveButtonDisabled : {})
              }}
            >
              {loading ? 'Saving...' : 'Save Current'}
            </button>
          </div>

          {/* Saves List */}
          <div style={styles.savesList}>
            {saves.length === 0 ? (
              <div style={styles.empty}>No saved states yet</div>
            ) : (
              saves.map(save => (
                <div
                  key={save.id}
                  onClick={() => handleLoad(save)}
                  style={styles.saveItem}
                >
                  <div style={styles.saveInfo}>
                    <span style={styles.saveName}>{save.name}</span>
                    <span style={styles.saveMeta}>
                      {formatDate(save.created_at)} {formatRevenue(save.annual_revenue) && `| ${formatRevenue(save.annual_revenue)}`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(save.id, e)}
                    style={styles.deleteButton}
                    aria-label={`Delete save: ${save.name}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '24px'
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  currentSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px'
  },
  currentSaveName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#22c55e'
  },
  currentSaveDate: {
    fontSize: '13px',
    color: '#a1a1aa'
  },
  toggleButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: '#fafafa',
    cursor: 'pointer'
  },
  panel: {
    marginTop: '12px',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '16px'
  },
  error: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    marginBottom: '12px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '13px'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px'
  },
  saveSection: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    background: '#0a0a0a',
    border: '1px solid #3f3f46',
    borderRadius: '6px',
    color: '#fafafa',
    outline: 'none'
  },
  saveButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    background: '#22c55e',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s'
  },
  saveButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  savesList: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#a1a1aa',
    fontSize: '14px'
  },
  saveItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  saveInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  saveName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fafafa'
  },
  saveMeta: {
    fontSize: '12px',
    color: '#a1a1aa'
  },
  deleteButton: {
    width: '32px',
    height: '32px',
    padding: 0,
    fontSize: '18px',
    background: 'transparent',
    border: '1px solid #3f3f46',
    borderRadius: '4px',
    color: '#a1a1aa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default SaveLoadPanel;
