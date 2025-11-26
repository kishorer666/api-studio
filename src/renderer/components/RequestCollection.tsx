import React, { useState } from 'react';
import { SavedRequest, loadRequests, saveRequest, deleteRequest } from '../utils/storage';

interface Props {
  onLoad: (request: SavedRequest) => void;
  current: Omit<SavedRequest, 'id' | 'name'>;
  loadedMeta?: { id: string; name: string } | null;
  loadedOriginal?: SavedRequest | null; // snapshot of originally loaded request
}

const RequestCollection: React.FC<Props> = ({ onLoad, current, loadedMeta, loadedOriginal }) => {
  const [requests, setRequests] = useState<SavedRequest[]>(loadRequests());
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Determine if loaded request (by id) differs from current form values -> dirty
  // Normalize arrays for comparison (trim keys/values) to catch subtle edits.
  const normalizeKV = (arr: { key: string; value: string }[]) => arr.map(kv => ({
    key: kv.key.trim(),
    value: kv.value.trim()
  }));
  const isDirty = loadedOriginal ? (
    loadedOriginal.method !== current.method ||
    loadedOriginal.url !== current.url ||
    JSON.stringify(normalizeKV(loadedOriginal.params)) !== JSON.stringify(normalizeKV(current.params)) ||
    JSON.stringify(normalizeKV(loadedOriginal.headers)) !== JSON.stringify(normalizeKV(current.headers)) ||
    loadedOriginal.body !== current.body ||
    loadedOriginal.bodyType !== current.bodyType
  ) : false;

  const handleSave = () => {
    if (!newName.trim()) return;
    const req: SavedRequest = {
      id: Date.now().toString(),
      name: newName,
      ...current,
    };
    saveRequest(req);
    setRequests(loadRequests());
    setNewName('');
  };

  const handleUpdate = () => {
    if (!loadedMeta || !loadedOriginal) return;
    setUpdating(true);
    const req: SavedRequest = {
      id: loadedMeta.id,
      name: loadedMeta.name,
      ...current,
    };
    saveRequest(req);
    setRequests(loadRequests());
    // Reload to refresh snapshot (parent will deep clone)
    onLoad(req);
    setTimeout(() => setUpdating(false), 300);
  };

  const handleLoad = (req: SavedRequest) => {
    onLoad(req);
  };

  const handleDelete = (id: string) => {
    deleteRequest(id);
    setRequests(loadRequests());
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-color)', marginBottom: 8, transition: 'color 0.3s ease' }}>Saved Requests</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Request name"
          style={{ borderRadius: 8, border: '1px solid var(--input-border)', padding: '6px 10px', fontSize: 15, background: 'var(--input-bg)', color: 'var(--text-color)', transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!newName.trim()}
          style={{
            borderRadius: 8,
            background: 'var(--button-bg)',
            color: 'var(--button-text)',
            fontWeight: 600,
            fontSize: 15,
            padding: '6px 14px',
            border: '1px solid var(--button-border)',
            cursor: newName.trim() ? 'pointer' : 'not-allowed',
            opacity: newName.trim() ? 1 : 0.5,
            transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, opacity 0.25s ease'
          }}
          title={newName.trim() ? 'Save current request' : 'Enter a name to enable save'}
        >
          Save
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {requests.map(req => {
          const isLoaded = loadedMeta && req.id === loadedMeta.id;
          return (
            <li key={req.id} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-color)', transition: 'color 0.3s ease' }}>{req.name}</span>
              <button
                type="button"
                onClick={() => handleLoad(req)}
                style={{
                  borderRadius: 6,
                  background: 'var(--button-bg)',
                  color: 'var(--button-text)',
                  fontSize: 13,
                  padding: '4px 10px',
                  border: '1px solid var(--button-border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease'
                }}
              >
                Load
              </button>
              <button
                type="button"
                onClick={() => handleDelete(req.id)}
                style={{
                  borderRadius: 6,
                  background: '#ff3b30',
                  color: '#fff',
                  fontSize: 13,
                  padding: '4px 10px',
                  border: '1px solid #d62820',
                  cursor: 'pointer'
                }}
                title="Delete this saved request"
              >
                Delete
              </button>
              {isLoaded && (
                <button
                  type="button"
                  disabled={!isDirty || updating}
                  onClick={handleUpdate}
                  style={{
                    borderRadius: 6,
                    background: isDirty ? 'var(--button-bg)' : 'var(--button-bg)',
                    color: 'var(--button-text)',
                    fontSize: 13,
                    padding: '4px 10px',
                    border: '1px solid var(--button-border)',
                    cursor: isDirty ? 'pointer' : 'not-allowed',
                    opacity: isDirty ? 1 : 0.5,
                    transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, opacity 0.25s ease'
                  }}
                  title={isDirty ? 'Update this saved request with current changes' : 'No changes to update'}
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RequestCollection;
