import React, { useState, useEffect } from 'react';
import { listSaves, loadSave, saveSave, updateSlotName, deleteSave, NUM_SAVE_SLOTS } from './storage';
import { INVENTORY_PRESETS } from './lib/presets';

export default function SaveLoadModal({ isOpen, onClose, currentData, onLoad }) {
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState(null);

  // Load save slots when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSaveSlots();
    }
  }, [isOpen]);

  const loadSaveSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const slots = await listSaves();
      setSaves(slots);
    } catch (err) {
      setError('Failed to load save slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slot) => {
    if (!currentData) {
      setError('No data to save');
      return;
    }

    // Confirm if slot already has data
    const existingSave = saves.find((s, idx) => idx + 1 === slot);
    if (existingSave && existingSave.data) {
      const confirmed = window.confirm(`Overwrite "${existingSave.name}"?`);
      if (!confirmed) return;
    }

    setLoading(true);
    setError(null);
    try {
      await saveSave(slot, currentData);
      await loadSaveSlots();
    } catch (err) {
      setError(`Failed to save to slot ${slot}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (slot) => {
    setLoading(true);
    setError(null);
    try {
      const saveData = await loadSave(slot);
      onLoad(saveData.data);
      onClose();
    } catch (err) {
      setError(`Failed to load from slot ${slot}`);
      console.error(err);
      setLoading(false);
    }
  };

  const handleLoadPreset = (presetKey) => {
    const preset = INVENTORY_PRESETS[presetKey];
    if (preset) {
      onLoad({
        inventory: preset.inventory,
        settings: preset.settings
      });
      onClose();
    }
  };

  const handleDelete = async (slot) => {
    const save = saves.find((s, idx) => idx + 1 === slot);
    const confirmed = window.confirm(`Delete "${save.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      await deleteSave(slot);
      await loadSaveSlots();
    } catch (err) {
      setError(`Failed to delete slot ${slot}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (slot, currentName) => {
    setEditingSlot(slot);
    setEditName(currentName);
  };

  const saveNameEdit = async () => {
    if (!editName.trim()) {
      setEditingSlot(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateSlotName(editingSlot, editName.trim());
      await loadSaveSlots();
      setEditingSlot(null);
    } catch (err) {
      setError(`Failed to update slot name`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditingSlot(null);
    setEditName('');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Empty';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #333',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            Save / Load Inventory
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#3f0000',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            color: '#ff8888'
          }}>
            {error}
          </div>
        )}

        {/* Section Header for Save Slots */}
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#a1a1aa',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Your Saved Data
        </h3>

        {/* Save Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {saves.map((save, idx) => {
            const slot = idx + 1;
            const isEmpty = !save.data;
            const isEditing = editingSlot === slot;

            return (
              <div
                key={slot}
                style={{
                  background: '#1a1a1a',
                  border: `1px solid ${isEmpty ? '#333' : '#444'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveNameEdit()}
                        style={{
                          background: '#0a0a0a',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#fafafa',
                          fontSize: '14px',
                          flex: 1
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveNameEdit}
                        style={{
                          padding: '6px 12px',
                          background: '#4a9eff',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          padding: '6px 12px',
                          background: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fafafa',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => !isEmpty && startEditing(slot, save.name)}
                        style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: isEmpty ? '#666' : '#fafafa',
                          cursor: isEmpty ? 'default' : 'pointer',
                          marginBottom: '4px'
                        }}
                      >
                        {save.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {formatTimestamp(save.timestamp)}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSave(slot)}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      background: '#166534',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#86efac',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleLoad(slot)}
                    disabled={isEmpty || loading}
                    style={{
                      padding: '8px 16px',
                      background: isEmpty ? '#333' : '#1e3a8a',
                      border: 'none',
                      borderRadius: '6px',
                      color: isEmpty ? '#666' : '#93c5fd',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isEmpty || loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(slot)}
                    disabled={isEmpty || loading}
                    style={{
                      padding: '8px 16px',
                      background: isEmpty ? '#333' : '#3f0000',
                      border: 'none',
                      borderRadius: '6px',
                      color: isEmpty ? '#666' : '#ff8888',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: isEmpty || loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{
          borderTop: '1px solid #333',
          marginTop: '24px',
          marginBottom: '24px'
        }} />

        {/* Preset Scenarios */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#a1a1aa',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Load Preset Scenario
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(INVENTORY_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleLoadPreset(key)}
                style={{
                  flex: '1 1 200px',
                  background: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#242424';
                  e.currentTarget.style.borderColor = '#4a9eff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#444';
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fafafa',
                  marginBottom: '6px'
                }}>
                  {preset.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#888',
                  lineHeight: '1.4'
                }}>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #333',
          fontSize: '12px',
          color: '#888'
        }}>
          Click save name to rename. Data is saved in your browser's local storage.
        </div>
      </div>
    </div>
  );
}
