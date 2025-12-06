import React, { useState, useEffect } from 'react';

function SaveLoadPanel({ inventory, annualRevenue, onLoad }) {
  const [saves, setSaves] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch saves on mount and when panel opens
  useEffect(() => {
    if (showPanel) {
      fetchSaves();
    }
  }, [showPanel]);

  const fetchSaves = async () => {
    try {
      const res = await fetch('/api/saves');
      if (res.ok) {
        const data = await res.json();
        setSaves(data);
      }
    } catch (err) {
      console.error('Failed to fetch saves:', err);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert('Please enter a name for this save');
      return;
    }

    setLoading(true);
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

      if (res.ok) {
        setSaveName('');
        fetchSaves();
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
    setLoading(false);
  };

  const handleLoad = (save) => {
    onLoad({
      inventory: save.inventory,
      annualRevenue: save.annual_revenue
    });
    setShowPanel(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this save?')) return;

    try {
      await fetch(`/api/saves?id=${id}`, { method: 'DELETE' });
      fetchSaves();
    } catch (err) {
      console.error('Failed to delete:', err);
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

  return (
    <div style={styles.container}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={styles.toggleButton}
      >
        {showPanel ? 'Close' : 'Save / Load'}
      </button>

      {showPanel && (
        <div style={styles.panel}>
          {/* Save Section */}
          <div style={styles.saveSection}>
            <input
              type="text"
              placeholder="e.g. Dec 6 - Koala restock"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={styles.input}
            />
            <button
              onClick={handleSave}
              disabled={loading}
              style={styles.saveButton}
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
                  >
                    x
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
    padding: '16px',
    animation: 'fadeIn 0.2s ease'
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
    whiteSpace: 'nowrap'
  },
  savesList: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#71717a',
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
    color: '#71717a'
  },
  deleteButton: {
    width: '24px',
    height: '24px',
    padding: 0,
    fontSize: '14px',
    background: 'transparent',
    border: '1px solid #3f3f46',
    borderRadius: '4px',
    color: '#71717a',
    cursor: 'pointer'
  }
};

export default SaveLoadPanel;
