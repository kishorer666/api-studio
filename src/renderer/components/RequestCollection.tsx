import React, { useState } from 'react';
import Button from './Button';
import { SavedRequest, loadRequests, saveRequest, deleteRequest, toggleFavorite } from '../utils/storage';
import { FiStar } from 'react-icons/fi';

interface WorkspaceContext {
  workspaceId: string;
  collectionId?: string;
  onPersist?: (req: SavedRequest) => void;
  onDelete?: (id: string) => void;
  onLog?: (message: string) => void; // audit logging callback
}

interface Props {
  onLoad: (request: SavedRequest) => void;
  current: Omit<SavedRequest, 'id' | 'name'>;
  loadedMeta?: { id: string; name: string } | null;
  loadedOriginal?: SavedRequest | null; // snapshot of originally loaded request
  workspaceContext?: WorkspaceContext; // optional collection aware persistence
  requestsSource?: SavedRequest[]; // optional external source (e.g., active collection requests)
}

const RequestCollection: React.FC<Props> = ({ onLoad, current, loadedMeta, loadedOriginal, workspaceContext, requestsSource }) => {
  const [requests, setRequests] = useState<SavedRequest[]>(requestsSource ?? loadRequests());
  const [newName, setNewName] = useState('');
  const [newFav, setNewFav] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmDeleteReq, setConfirmDeleteReq] = useState<SavedRequest | null>(null);

  // Keep local list in sync with external source when provided (e.g., active collection changes)
  React.useEffect(() => {
    if (Array.isArray(requestsSource)) {
      setRequests(requestsSource);
    }
  }, [requestsSource]);

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
      favorite: newFav
    };
    if (workspaceContext?.onPersist && workspaceContext.collectionId) {
      workspaceContext.onPersist(req);
      // For collection mode refresh from workspace context is external; but keep local list minimal
      setRequests(prev => [...prev, req]);
    } else {
      saveRequest(req);
      setRequests(loadRequests());
    }
    setNewName('');
    setNewFav(false);
  };

  const handleUpdate = () => {
    if (!loadedMeta || !loadedOriginal) return;
    setUpdating(true);
    const req: SavedRequest = {
      id: loadedMeta.id,
      name: loadedMeta.name,
      ...current,
    };
    if (workspaceContext?.onPersist && workspaceContext.collectionId) {
      workspaceContext.onPersist(req);
      setRequests(prev => prev.map(r => r.id === req.id ? req : r));
    } else {
      saveRequest(req);
      setRequests(loadRequests());
    }
    // Reload to refresh snapshot (parent will deep clone)
    onLoad(req);
    setTimeout(() => setUpdating(false), 300);
  };

  const handleLoad = (req: SavedRequest) => {
    onLoad(req);
  };

  const performDelete = (id: string) => {
    let deletedName: string | undefined;
    const target = requests.find(r => r.id === id);
    if (target) deletedName = target.name;
    if (workspaceContext?.onDelete && workspaceContext.collectionId) {
      workspaceContext.onDelete(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    } else {
      deleteRequest(id);
      setRequests(loadRequests());
    }
    if (deletedName && workspaceContext?.onLog) {
      workspaceContext.onLog(`Deleted request '${deletedName}' at ${new Date().toLocaleTimeString()}`);
    }
  };

  return (
    <>
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Request name"
          style={{ borderRadius: 8, border: '1px solid var(--input-border)', padding: '6px 10px', fontSize: 15, background: 'var(--input-bg)', color: 'var(--text-color)', transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <input type="checkbox" checked={newFav} onChange={e => setNewFav(e.target.checked)} /> Favorite
        </label>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!newName.trim()}
          size="md"
          title={newName.trim() ? 'Save current request' : 'Enter a name to enable save'}
        >Save</Button>
      </div>
      {/* Favorites first */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {[...requests].sort((a,b) => (b.favorite?1:0) - (a.favorite?1:0)).map(req => {
          const isLoaded = loadedMeta && req.id === loadedMeta.id;
          return (
            <li key={req.id} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-color)', transition: 'color 0.3s ease' }}>{req.name}</span>
              <button
                type="button"
                onClick={() => {
                  if (workspaceContext?.collectionId && workspaceContext.onPersist) {
                    const updated: SavedRequest = { ...req, favorite: !req.favorite };
                    workspaceContext.onPersist(updated);
                    setRequests(prev => prev.map(r => r.id === req.id ? updated : r));
                  } else {
                    toggleFavorite(req.id, !req.favorite);
                    setRequests(loadRequests());
                  }
                }}
                title={req.favorite ? 'Unfavorite' : 'Mark favorite'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: req.favorite ? 'var(--accent)' : 'var(--subtle-text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <FiStar style={{ fontSize: 16 }} />
              </button>
              <Button
                type="button"
                onClick={() => handleLoad(req)}
                size="sm"
                variant="subtle"
                title="Load this request"
              >Load</Button>
              <Button
                type="button"
                onClick={() => setConfirmDeleteReq(req)}
                size="sm"
                variant="danger"
                title="Delete this saved request"
              >Delete</Button>
              {isLoaded && (
                <Button
                  type="button"
                  disabled={!isDirty || updating}
                  onClick={handleUpdate}
                  size="sm"
                  title={isDirty ? 'Update this saved request with current changes' : 'No changes to update'}
                >{updating ? 'Updating…' : 'Update'}</Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
    {confirmDeleteReq && (
      <div role="dialog" aria-modal="true" style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)', zIndex:10000 }}>
        <div style={{ background:'var(--panel-bg)', color:'var(--text-color)', border:'1px solid var(--panel-border)', borderRadius:12, padding:20, minWidth:300, boxShadow:'0 6px 24px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:15, fontWeight:600 }}>Delete Request</div>
          <div style={{ fontSize:13 }}>Remove saved request '<strong>{confirmDeleteReq.name}</strong>'?</div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Button type="button" size="sm" variant="subtle" onClick={() => setConfirmDeleteReq(null)}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => { performDelete(confirmDeleteReq.id); setConfirmDeleteReq(null); }}>Yes</Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default RequestCollection;
