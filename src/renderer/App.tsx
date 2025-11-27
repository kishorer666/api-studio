import React, { useState, useEffect, useRef, useMemo } from 'react';
import Panel from './components/Panel';
import Button from './components/Button';
import SplitPane from './components/SplitPane';
import { SavedRequest, saveRequest } from './utils/storage';
import KeyValueInputs from './components/KeyValueInputs';
import RequestCollection from './components/RequestCollection';
import Tabs from './components/Tabs';
import { buildQueryString, buildHeaders, KeyValue } from './utils/requestHelpers';
import { ensureDefaultWorkspace, loadWorkspaces, setActiveWorkspace as persistActiveWorkspace, addWorkspace, addCollection, saveRequestToCollection, deleteRequestFromCollection, toggleFavoriteInCollection, renameWorkspace, deleteWorkspace, reorderCollections, exportWorkspace, importWorkspace, setActiveCollection, deleteCollection, cleanupWorkspaces, collapseWorkspacesToSingle, Workspace } from './utils/workspaceStorage';
import { FiSettings, FiSend, FiShuffle } from 'react-icons/fi';
import { useStorage } from './platform/PlatformContext';

// Inline styles using CSS variables for theming
const styles: { [k: string]: React.CSSProperties | string } = {
  container: {
    width: '100%',
    height: '100vh',
    margin: 0,
    fontFamily: 'Arial, Helvetica, sans-serif',
    background: 'var(--bg)',
    boxSizing: 'border-box',
    color: 'var(--text-color)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s',
    display: 'flex',
    flexDirection: 'column'
  },
  heading: {
    fontWeight: 700,
    fontSize: 24,
    margin: 0,
    color: 'var(--text-color)',
    letterSpacing: -0.5,
    transition: 'color 0.35s'
  },
  form: { marginBottom: 24 },
  row: { display: 'flex', gap: 12, marginBottom: 18 },
  select: {
    borderRadius: 8,
    border: '1px solid var(--input-border)',
    padding: '8px 12px',
    fontSize: 16,
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  },
  input: {
    borderRadius: 8,
    border: '1px solid var(--input-border)',
    padding: '8px 12px',
    fontSize: 16,
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    flex: 1,
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  },
  button: {
    borderRadius: 8,
    border: '1px solid var(--button-border)',
    background: 'var(--button-bg)',
    color: 'var(--button-text)',
    fontSize: 16,
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.25s, color 0.25s, border-color 0.25s'
  },
  bodySection: { marginTop: 12, marginBottom: 24 },
  bodyLabel: { fontWeight: 600, display: 'block', marginBottom: 8 },
  bodyRow: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: 'var(--subtle-text)', transition: 'color 0.35s' },
  textarea: {
    width: '100%',
    minHeight: 160,
    borderRadius: 8,
    border: '1px solid var(--input-border)',
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 14,
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  },
  panel: {
    background: 'var(--panel-bg)',
    border: '1px solid var(--panel-border)',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 13,
    maxHeight: 240,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: 'var(--text-color)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  },
  responsePanel: {
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--panel-border)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  }
};

const bodyTypes = [
  { label: 'JSON', value: 'application/json' },
  { label: 'Form URL Encoded', value: 'application/x-www-form-urlencoded' },
  { label: 'Text', value: 'text/plain' },
];

// Helper: blend two hex colors by ratio (0..1)
function blend(lightHex: string, darkHex: string, ratio: number): string {
  const lh = lightHex.replace('#', '');
  const dh = darkHex.replace('#', '');
  const lr = parseInt(lh.substring(0, 2), 16);
  const lg = parseInt(lh.substring(2, 4), 16);
  const lb = parseInt(lh.substring(4, 6), 16);
  const dr = parseInt(dh.substring(0, 2), 16);
  const dg = parseInt(dh.substring(2, 4), 16);
  const db = parseInt(dh.substring(4, 6), 16);
  const r = Math.round(lr + (dr - lr) * ratio);
  const g = Math.round(lg + (dg - lg) * ratio);
  const b = Math.round(lb + (db - lb) * ratio);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function computeTheme(isDark: boolean, dimLevel: number) {
  // Base palettes
  const light = {
    bg: '#f7f8fa',
    panelBg: '#ffffff',
    panelBorder: '#d9dee3',
    text: '#1f2d3d',
    subtle: '#556270',
    accent: '#0a84ff',
    buttonBg: '#0a84ff',
    buttonBorder: '#0a84ff',
    buttonText: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db'
  };
  const dark = {
    bg: '#1d1f23',
    panelBg: '#24272c',
    panelBorder: '#3a4048',
    text: '#e6e9ed',
    subtle: '#9aa4b0',
    accent: '#0a84ff',
    buttonBg: '#0a84ff',
    buttonBorder: '#3a7bd9',
    buttonText: '#ffffff',
    inputBg: '#2b2f35',
    inputBorder: '#3a4048'
  };
  // New rule: light mode ignores dim (ratio=0), dark mode uses dimLevel directly.
  const ratio = isDark ? Math.min(1, Math.max(0, dimLevel)) : 0;
  return {
    '--bg': blend(light.bg, dark.bg, ratio),
    '--panel-bg': blend(light.panelBg, dark.panelBg, ratio),
    '--panel-border': blend(light.panelBorder, dark.panelBorder, ratio),
    '--text-color': blend(light.text, dark.text, ratio),
    '--subtle-text': blend(light.subtle, dark.subtle, ratio),
    '--accent': dark.accent,
    '--button-bg': blend(light.buttonBg, dark.buttonBg, ratio),
    '--button-border': blend(light.buttonBorder, dark.buttonBorder, ratio),
    '--button-text': dark.buttonText,
    '--input-bg': blend(light.inputBg, dark.inputBg, ratio),
    '--input-border': blend(light.inputBorder, dark.inputBorder, ratio)
  } as React.CSSProperties;
}

const App: React.FC = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<KeyValue[]>([]);
  const [headers, setHeaders] = useState<KeyValue[]>([]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [bodyType, setBodyType] = useState(bodyTypes[0].value);
  const [logs, setLogs] = useState<string[]>([]);
  const [loadedRequestMeta, setLoadedRequestMeta] = useState<{id:string; name:string} | null>(null);
  const [loadedRequestOriginal, setLoadedRequestOriginal] = useState<SavedRequest | null>(null);
  const [collapseParams, setCollapseParams] = useState(false);
  const [collapseHeaders, setCollapseHeaders] = useState(false);
  const [collapseBody, setCollapseBody] = useState(false);
  // Tab state for request sub-sections
  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'headers' | 'body'>('params');
  const [prettyResponse, setPrettyResponse] = useState(true);
  // Workspace/Collection state
  const [workspaces, setWorkspaces] = useState<Workspace[]>(loadWorkspaces());
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(() => ensureDefaultWorkspace());
  const activeCollection = activeWorkspace.collections.find(c => c.id === activeWorkspace.activeCollectionId) || activeWorkspace.collections[0];
  const [collectionSort, setCollectionSort] = useState<'alphabetical' | 'lastUpdated' | 'favoritesFirst'>('alphabetical');
  const sortedCollections = useMemo(() => {
    const arr = [...(activeWorkspace.collections || [])];
    if (collectionSort === 'alphabetical') {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (collectionSort === 'lastUpdated') {
      arr.sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0));
    } else {
      const favCount = (c: any) => (c.requests || []).filter((r: any) => r.favorite).length;
      arr.sort((a, b) => favCount(b) - favCount(a));
    }
    return arr;
  }, [activeWorkspace.collections, collectionSort]);
  const [collectionListVersion, setCollectionListVersion] = useState(0); // force re-render after reorder
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [dimLevel, setDimLevel] = useState(0); // 0..1
  const [showSettings, setShowSettings] = useState(false);
  // Auto-save preference (default enabled)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const themeVars = useMemo(() => computeTheme(isDark, dimLevel), [isDark, dimLevel]);
  // Auto-save status
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [autoSavePending, setAutoSavePending] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const AUTO_SAVE_DELAY = 1500; // ms inactivity
  // Toasts
  type Toast = { id: number; message: string };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  };

  // Cleanup duplicates in stored workspaces on mount
  useEffect(() => {
    // One-time storage migration to single workspace model
    try { collapseWorkspacesToSingle(); } catch {/* ignore */}
    cleanupWorkspaces();
    // Refresh local state after cleanup
    setWorkspaces(loadWorkspaces());
    const ws = ensureDefaultWorkspace();
    setActiveWorkspaceState(ws);
  }, []);

  // Auto-refresh collections: periodically reload workspaces/collections
  useEffect(() => {
    const interval = window.setInterval(() => {
      const latest = loadWorkspaces();
      setWorkspaces(latest);
      const active = latest.find(w => w.id === activeWorkspace.id) || ensureDefaultWorkspace();
      setActiveWorkspaceState(active);
    }, 2000); // refresh every 2s
    return () => window.clearInterval(interval);
  }, [activeWorkspace.id]);

  // Compute dirty relative to loadedOriginal (mirrors logic in RequestCollection)
  const computeDirty = () => {
    if (!loadedRequestOriginal) return false;
    const norm = (arr: KeyValue[]) => arr.map(kv => ({ key: kv.key.trim(), value: kv.value.trim() }));
    return (
      loadedRequestOriginal.method !== method ||
      loadedRequestOriginal.url !== url ||
      JSON.stringify(norm(loadedRequestOriginal.params || [])) !== JSON.stringify(norm(params)) ||
      JSON.stringify(norm(loadedRequestOriginal.headers || [])) !== JSON.stringify(norm(headers)) ||
      (loadedRequestOriginal.body || '') !== body ||
      (loadedRequestOriginal.bodyType || '') !== bodyType
    );
  };

  // Debounced auto-save of existing loaded request
  useEffect(() => {
    if (!autoSaveEnabled) {
      // Clear any pending timer when disabling
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setAutoSavePending(false);
      return;
    }
    if (!loadedRequestMeta || !loadedRequestOriginal) return; // only autosave for already saved request
    const dirty = computeDirty();
    if (!dirty) {
      // Clear pending timer if state reverted
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setAutoSavePending(false);
      return;
    }
    // Skip auto-save if request is effectively empty (no url, headers, params, body)
    const urlHasContent = url.trim().length > 0;
    const nonEmptyParams = params.some(p => p.key.trim() || p.value.trim());
    const nonEmptyHeaders = headers.some(h => h.key.trim() || h.value.trim());
    const bodyHasContent = body.trim().length > 0;
    if (!urlHasContent && !nonEmptyParams && !nonEmptyHeaders && !bodyHasContent) {
      return; // don't persist blank state
    }
    // Reset existing timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSavePending(true);
    autoSaveTimerRef.current = window.setTimeout(() => {
      // Perform auto-save
      try {
        const req: SavedRequest = {
          id: loadedRequestMeta.id,
          name: loadedRequestMeta.name,
          method,
          url,
          params: params.filter(kv => kv.key.trim() || kv.value.trim()).map(kv => ({ ...kv })),
          headers: headers.filter(kv => kv.key.trim() || kv.value.trim()).map(kv => ({ ...kv })),
          body,
          bodyType
        };
        // Direct storage update
        saveRequest(req);
        // Refresh snapshot baseline
        setLoadedRequestOriginal({ ...req, params: req.params.map(kv => ({ ...kv })), headers: req.headers.map(kv => ({ ...kv })) });
        setLogs(l => [...l, `Auto-saved request '${req.name}' at ${new Date().toLocaleTimeString()}`]);
        setLastAutoSave(new Date().toLocaleTimeString());
        setAutoSavePending(false);
      } catch (e:any) {
        setLogs(l => [...l, `Auto-save failed: ${e.message}`]);
        setAutoSavePending(false);
      }
      autoSaveTimerRef.current = null;
    }, AUTO_SAVE_DELAY);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        setAutoSavePending(false);
      }
    };
  }, [method, url, params, headers, body, bodyType, loadedRequestMeta, loadedRequestOriginal, autoSaveEnabled]);

  const storage = useStorage();
  // Load persisted theme & auto-save preferences once
  useEffect(() => {
    try {
      const persistedDark = storage.getItem('apiStudio.theme.dark');
      const persistedDim = storage.getItem('apiStudio.theme.dim');
      const persistedAuto = storage.getItem('apiStudio.autoSave.enabled');
      if (persistedDark === 'true') setIsDark(true);
      if (persistedDark === 'false') setIsDark(false);
      if (persistedDim) {
        const v = parseFloat(persistedDim);
        if (!isNaN(v)) setDimLevel(Math.min(1, Math.max(0, v)));
      }
      if (persistedAuto === 'false') setAutoSaveEnabled(false);
      if (persistedAuto === 'true') setAutoSaveEnabled(true);
    } catch {/* ignore */}
  }, [storage]);

  // Persist when changed
  useEffect(() => {
    try {
      storage.setItem('apiStudio.theme.dark', String(isDark));
      storage.setItem('apiStudio.theme.dim', String(dimLevel));
      storage.setItem('apiStudio.autoSave.enabled', String(autoSaveEnabled));
    } catch {/* ignore */}
  }, [isDark, dimLevel, autoSaveEnabled, storage]);
  // Restore last active request tab
  useEffect(() => {
    try {
      const last = storage.getItem('apiStudio.request.activeTab');
      if (last === 'params' || last === 'headers' || last === 'body') {
        // If last was body but method currently not supporting, fallback
        if (last === 'body' && !['POST','PUT','PATCH'].includes(method)) {
          setActiveRequestTab('params');
        } else {
          setActiveRequestTab(last);
        }
      }
    } catch {/* ignore */}
  }, [storage, method]);
  // Persist active request tab
  useEffect(() => {
    try { storage.setItem('apiStudio.request.activeTab', activeRequestTab); } catch {/* ignore */}
  }, [activeRequestTab, storage]);
  // Responsive breakpoint handling
  const [isNarrow, setIsNarrow] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 1000);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Legacy manual column resizer removed; SplitPane handles resizing.

  // Ensure body tab not active for methods without body
  useEffect(() => {
    if (!['POST', 'PUT', 'PATCH'].includes(method) && activeRequestTab === 'body') {
      setActiveRequestTab('params');
      try { storage.setItem('apiStudio.request.activeTab', 'params'); } catch {/* ignore */}
    }
  }, [method, activeRequestTab, storage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl/Cmd+Enter: send request
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!loading && url.trim()) {
          sendRequest(new Event('submit') as any);
        }
      }
      // Ctrl/Cmd+Shift+S: toggle settings
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSettings(s => !s);
      }
      // Alt+1/2/3: switch tabs (skip body if method can't have body)
      if (e.altKey && ['1','2','3'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, 'params' | 'headers' | 'body'> = { '1': 'params', '2': 'headers', '3': 'body' };
        const target = map[e.key];
        if (target === 'body' && !['POST','PUT','PATCH'].includes(method)) return;
        setActiveRequestTab(target);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, url, method]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return; // guard against empty URL submissions
    setLoading(true);
    setResponse('');
    setLogs([]);
    let fullUrl = url;
    const queryString = buildQueryString(params);
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    let reqHeaders = buildHeaders(headers);
    let reqBody: string | undefined = undefined;
    setLogs(logs => [
      ...logs,
      `Request:`,
      `URL: ${fullUrl}`,
      `Method: ${method}`,
      `Headers: ${JSON.stringify(reqHeaders, null, 2)}`,
      `BodyType: ${bodyType}`,
      `Body: ${body}`
    ]);
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      reqHeaders['Content-Type'] = bodyType;
      if (bodyType === 'application/json') {
        try {
          reqBody = JSON.stringify(JSON.parse(body));
        } catch {
          reqBody = body; // fallback if not valid JSON
        }
      } else if (bodyType === 'application/x-www-form-urlencoded') {
        reqBody = body; // Expect body as key=value&key2=value2
      } else {
        reqBody = body;
      }
    }
    try {
      const res = await fetch(fullUrl, {
        method,
        headers: reqHeaders,
        body: reqBody,
      });
      const text = await res.text();
      setResponse(text);
      setLogs(logs => [...logs, `Status: ${res.status}`, `Response received.`]);
    } catch (err: any) {
      setResponse('Error: ' + err.message);
      setLogs(logs => [...logs, `Error: ${err.message}`]);
    }
    setLoading(false);
  };

  // Helper to load a saved request into the form
  const handleLoadRequest = (req: SavedRequest) => {
    // Deep clone arrays to prevent mutation of original snapshot
    const clonedParams = (req.params || []).map(kv => ({ ...kv }));
    const clonedHeaders = (req.headers || []).map(kv => ({ ...kv }));
    setMethod(req.method);
    setUrl(req.url);
    setParams(clonedParams);
    setHeaders(clonedHeaders);
    setBody(req.body || '');
    setBodyType(req.bodyType || bodyTypes[0].value);
    setLogs([`Loaded request: ${req.name}`]);
    setResponse('');
    setLoadedRequestMeta({ id: req.id, name: req.name });
    // Store separate deep clone for original snapshot
    setLoadedRequestOriginal({ ...req, params: clonedParams.map(kv => ({ ...kv })), headers: clonedHeaders.map(kv => ({ ...kv })) });
  };

  // Workspace helpers
  const refreshWorkspaces = () => {
    setWorkspaces(loadWorkspaces());
    const updatedActive = loadWorkspaces().find(w => w.id === activeWorkspace.id);
    if (updatedActive) setActiveWorkspaceState(updatedActive);
  };

  // Inline creation inputs to avoid prompt issues
  const [newCollectionName, setNewCollectionName] = useState('');
  // Refs to restore focus and ensure interactivity after collection deletion (Electron focus quirk)
  const collectionInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const [collectionDeletionTick, setCollectionDeletionTick] = useState(0);
  // Force remount of input elements after destructive operations to bypass Electron focus freeze
  const [inputEpoch, setInputEpoch] = useState(0);
  // Confirmation dialog state for collection deletion
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // After a collection deletion (tick increments) or collections length change, forcibly re-focus inputs.
  useEffect(() => {
    // Use rAF chain to ensure DOM is stable after React commit & native confirm focus shift.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (collectionInputRef.current) {
          collectionInputRef.current.blur();
          collectionInputRef.current.focus();
        }
        if (urlInputRef.current) {
          // Only refocus URL if it's empty (avoid stealing focus from user editing request form)
          if (urlInputRef.current.value.trim() === '') {
            urlInputRef.current.blur();
            urlInputRef.current.focus();
          }
        }
      });
    });
  }, [collectionDeletionTick, activeWorkspace.collections.length]);

  const handleSelectWorkspace = (id: string) => {
    persistActiveWorkspace(id);
    const ws = loadWorkspaces().find(w => w.id === id);
    if (ws) setActiveWorkspaceState(ws);
    setWorkspaces(loadWorkspaces());
  };

  // Workspace creation removed per UX update

  const handleAddCollection = () => {
    const name = (newCollectionName && newCollectionName.trim());
    if (!name) {
      alert('Please enter a collection name.');
      return;
    }
    // Check for duplicates in current workspace (case-insensitive)
    const dup = (activeWorkspace.collections || []).some(c => c.name.trim().toLowerCase() === name.toLowerCase());
    if (dup) {
      addToast(`Duplicate blocked: ${name} already exists`);
      return;
    }
    const col = addCollection(activeWorkspace.id, name);
    if (!col) {
      addToast('Unable to create collection');
      return;
    }
    setNewCollectionName('');
    refreshWorkspaces();
    addToast(`Collection created: ${name}`);
  };

  const handleRenameWorkspace = () => {
    const name = prompt('Rename workspace:', activeWorkspace.name);
    if (!name || !name.trim()) return;
    renameWorkspace(activeWorkspace.id, name.trim());
    refreshWorkspaces();
  };

  const handleDeleteWorkspace = () => {
    if (!confirm('Delete this workspace? (Requests remain only in other workspaces)')) return;
    deleteWorkspace(activeWorkspace.id);
    setWorkspaces(loadWorkspaces());
    const ws = ensureDefaultWorkspace();
    setActiveWorkspaceState(ws);
  };

  const handleExportWorkspace = () => {
    const json = exportWorkspace(activeWorkspace.id);
    if (json) {
      // Show export via prompt
      alert('Workspace JSON exported to clipboard length: '+json.length);
      try { navigator.clipboard.writeText(json); } catch {/* ignore */}
    }
  };

  const handleImportWorkspace = () => {
    const json = prompt('Paste workspace JSON');
    if (!json) return;
    const ok = importWorkspace(json);
    if (!ok) {
      alert('Import failed');
    } else {
      setWorkspaces(loadWorkspaces());
      const ws = ensureDefaultWorkspace();
      setActiveWorkspaceState(ws);
    }
  };

  const handleReorderCollection = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    reorderCollections(activeWorkspace.id, from, to);
    refreshWorkspaces();
    setCollectionListVersion(v => v + 1);
  };

  // Override save/update logic to route to collection storage as well
  const persistRequestToCollection = (req: SavedRequest) => {
    if (activeWorkspace && activeCollection) {
      saveRequestToCollection(activeWorkspace.id, activeCollection.id, req);
      refreshWorkspaces();
    }
  };

  // Render helpers for new layout pieces
  const renderRequestForm = () => (
    <form onSubmit={sendRequest} style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          style={{ ...(styles.select as React.CSSProperties), flex: '0 0 90px' }}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter request URL"
          style={{ ...(styles.input as React.CSSProperties), flex: '1 1 240px', minWidth: 0 }}
          ref={urlInputRef}
          key={inputEpoch + '-url'}
          required
        />
        <div style={{ display: 'flex', flex: '0 0 auto' }}>
          <Button
            type="submit"
            disabled={loading || !url}
            size="md"
            icon={<FiSend />}
          >{loading ? 'Sending…' : 'Send'}</Button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Tabs
          tabs={[
            { id: 'params', label: 'Query Params', content: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <KeyValueInputs items={params} setItems={setParams} label="" />
              </div>
            )},
            { id: 'headers', label: 'Headers', content: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <KeyValueInputs items={headers} setItems={setHeaders} label="" />
              </div>
            )},
            ...(['POST', 'PUT', 'PATCH'].includes(method) ? [{ id: 'body', label: 'Body', content: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={bodyType} onChange={e => setBodyType(e.target.value)} style={styles.select as React.CSSProperties}>
                    {bodyTypes.map(bt => (
                      <option key={bt.value} value={bt.value}>{bt.label}</option>
                    ))}
                  </select>
                  <span style={styles.label as React.CSSProperties}>{bodyType}</span>
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={
                    bodyType === 'application/json'
                      ? 'Request body (JSON)'
                      : bodyType === 'application/x-www-form-urlencoded'
                      ? 'key=value&key2=value2'
                      : 'Request body (text)'
                  }
                  style={{ ...(styles.textarea as React.CSSProperties), minHeight: 200 }}
                />
              </div>
            )}] : [])
          ]}
          activeId={activeRequestTab}
          onChange={(id) => setActiveRequestTab(id as 'params' | 'headers' | 'body')}
        />
      </div>
    </form>
  );

  const renderResponseActions = () => (
    <Button
      type="button"
      variant="subtle"
      size="sm"
      onClick={() => setPrettyResponse(p => !p)}
      title={prettyResponse ? 'Show raw' : 'Show pretty'}
      icon={<FiShuffle />}
    >{prettyResponse ? 'Raw' : 'Pretty'}</Button>
  );

  const renderResponseContent = () => (
    <pre style={{ ...(styles.panel as React.CSSProperties), ...(styles.responsePanel as React.CSSProperties), minHeight: 240 }}>
      {(() => {
        if (!prettyResponse) return response;
        try {
          const obj = JSON.parse(response);
          return JSON.stringify(obj, null, 2);
        } catch {
          return response;
        }
      })()}
    </pre>
  );

  const renderLogsContent = () => (
    <pre style={{ ...(styles.panel as React.CSSProperties), maxHeight: 200 }}>
      {logs.join('\n')}
    </pre>
  );

  return (
    <div ref={containerRef} style={{ ...styles.container as React.CSSProperties, ...themeVars }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', borderBottom: '1px solid var(--panel-border)', gap: 12, ...themeVars, minHeight: 40 }}>
        <h1 style={styles.heading as React.CSSProperties}>API Studio {autoSaveEnabled ? (autoSavePending ? <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 12, color: 'var(--subtle-text)' }}>Saving…</span> : (lastAutoSave && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 12, color: 'var(--subtle-text)' }}>Auto-saved {lastAutoSave}</span>)) : <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 12, color: 'var(--subtle-text)' }}>Auto-save off</span>}</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => setShowSettings(s => !s)}
            title="Settings"
            icon={<FiSettings />}
          >Settings</Button>
        </div>
      </div>
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 20,
            width: 260,
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            zIndex: 10,
            color: 'var(--text-color)',
            fontSize: 14
          }}
        >
          <div style={{ fontWeight: 600 }}>Appearance</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isDark}
              onChange={e => {
                const checked = e.target.checked;
                setIsDark(checked);
                if (checked) {
                  // Auto-dim to 80% when enabling dark mode
                  setDimLevel(0.8);
                } else {
                  // Reset to normal when disabling dark mode
                  setDimLevel(0);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            Dark Mode
          </label>
          {isDark && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor="dim-level-slider" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                Dim Level <span style={{ fontWeight: 600 }}>({dimLevel.toFixed(2)})</span>
              </label>
              <input
                id="dim-level-slider"
                aria-label="Dim Level"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={dimLevel}
                onChange={e => setDimLevel(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={e => setAutoSaveEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-save loaded requests
          </label>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            onClick={() => setShowSettings(false)}
          >Close</Button>
        </div>
      )}
      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position:'fixed', top: 50, right: 16, display:'flex', flexDirection:'column', gap:8, zIndex: 9999 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background:'var(--panel-bg)', color:'var(--text-color)', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 12px', boxShadow:'0 4px 12px rgba(0,0,0,0.25)', fontSize:12 }}>{t.message}</div>
          ))}
        </div>
      )}
      {/* Main content area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {isNarrow ? (
          <div style={{ display: 'flex', flexDirection: 'column', padding: 12, gap: 12, width: '100%', boxSizing: 'border-box', minHeight: 0 }}>
            <Panel title="Collections">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Workspace selector removed per single-workspace UX */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    style={{ ...(styles.input as React.CSSProperties), flex: '1 1 160px', minWidth: 0 }}
                    ref={collectionInputRef}
                    key={inputEpoch + '-col-narrow'}
                  />
                  <Button type="button" size="sm" onClick={handleAddCollection} variant="subtle">Create Collection</Button>
                  {/* Workspace management removed per collection-centric UX */}
                </div>
                <div>
                  <strong style={{ fontSize: 12 }}>Collection:</strong> {activeCollection?.name || 'None'}
                </div>
                {activeWorkspace.collections && activeWorkspace.collections.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <label htmlFor="narrow-collection-sort" style={{ fontSize: 12, color:'var(--subtle-text)' }}>Sort</label>
                      <select id="narrow-collection-sort" value={collectionSort} onChange={e => setCollectionSort(e.target.value as any)} style={styles.select as React.CSSProperties}>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="lastUpdated">Recently Updated</option>
                        <option value="favoritesFirst">Favorites First</option>
                      </select>
                    </div>
                    {sortedCollections.map((c, idx) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <button type="button" onClick={() => { setActiveCollection(activeWorkspace.id, c.id); refreshWorkspaces(); }} style={{ background:'transparent', border:'1px solid var(--panel-border)', padding:'2px 6px', borderRadius:6, cursor:'pointer', color: c.id===activeWorkspace.activeCollectionId? 'var(--accent)': 'var(--text-color)' }}>{c.name} ({c.requests.length}{c.requests.some(r=>r.favorite)?' ★':''})</button>
                        <div style={{ display:'flex', gap:2 }}>
                          <button type="button" disabled={idx===0} onClick={() => handleReorderCollection(idx,'up')} style={{ background:'transparent', border:'none', cursor: idx===0?'default':'pointer', color:'var(--subtle-text)' }}>↑</button>
                          <button type="button" disabled={idx===activeWorkspace.collections.length-1} onClick={() => handleReorderCollection(idx,'down')} style={{ background:'transparent', border:'none', cursor: idx===activeWorkspace.collections.length-1?'default':'pointer', color:'var(--subtle-text)' }}>↓</button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                              style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--subtle-text)' }}
                              title="Delete collection"
                            >🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--subtle-text)' }}>Create a collection in this workspace to manage requests.</div>
                )}
              </div>
            </Panel>
              <Panel title={`Create Request`}>
                {activeCollection ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <RequestCollection
                      onLoad={handleLoadRequest}
                      current={{ method, url, params, headers, body, bodyType }}
                      loadedMeta={loadedRequestMeta}
                      loadedOriginal={loadedRequestOriginal}
                      workspaceContext={{
                        workspaceId: activeWorkspace.id,
                        collectionId: activeCollection?.id,
                        onPersist: persistRequestToCollection,
                        onDelete: (id) => { deleteRequestFromCollection(activeWorkspace.id, activeCollection.id, id); refreshWorkspaces(); },
                        onLog: (msg) => setLogs(l => [...l, msg])
                      }}
                      requestsSource={activeCollection?.requests}
                    />
                  </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--subtle-text)' }}>No collection selected. Create and select a collection to save requests.</div>
              )}
            </Panel>
            <Panel
              title="Request"
              style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
              contentStyle={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}
            >
              {renderRequestForm()}
            </Panel>
            <Panel title="Output" actions={renderResponseActions()}>
              <Tabs
                tabs={[
                  { id: 'response', label: 'Response', content: renderResponseContent() },
                  { id: 'logs', label: 'Activity', content: renderLogsContent() }
                ]}
                activeId={'response'}
                onChange={(id) => {
                  // force re-render by updating state if needed (could extend with local state)
                  setPrettyResponse(p => p); // no-op placeholder
                }}
              />
            </Panel>
          </div>
        ) : (
          <SplitPane direction="vertical" initialPrimarySize={360} minPrimarySize={260}>
            {/* Left sidebar */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
              <Panel title="Collections">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      placeholder="Collection name"
                      style={{ ...(styles.input as React.CSSProperties), flex: '1 1 160px', minWidth: 0 }}
                      ref={collectionInputRef}
                      key={inputEpoch + '-col-wide'}
                    />
                    <Button type="button" size="sm" onClick={handleAddCollection} variant="subtle">Create Collection</Button>
                    {/* Collections list with delete control (wide layout) */}
                    <div style={{ display:'flex', flexDirection:'column', gap:4, width:'100%' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <label htmlFor="wide-collection-sort" style={{ fontSize: 12, color:'var(--subtle-text)' }}>Sort</label>
                        <select id="wide-collection-sort" value={collectionSort} onChange={e => setCollectionSort(e.target.value as any)} style={styles.select as React.CSSProperties}>
                          <option value="alphabetical">Alphabetical</option>
                          <option value="lastUpdated">Recently Updated</option>
                          <option value="favoritesFirst">Favorites First</option>
                        </select>
                      </div>
                      {sortedCollections.map((c, idx) => (
                        <div key={c.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                          <button type="button" onClick={() => { setActiveCollection(activeWorkspace.id, c.id); refreshWorkspaces(); }} style={{ background:'transparent', border:'1px solid var(--panel-border)', padding:'2px 6px', borderRadius:6, cursor:'pointer', color: c.id===activeWorkspace.activeCollectionId? 'var(--accent)': 'var(--text-color)' }}>{c.name} ({c.requests.length}{c.requests.some(r=>r.favorite)?' ★':''})</button>
                          <div style={{ display:'flex', gap:2 }}>
                            <button type="button" disabled={idx===0} onClick={() => handleReorderCollection(idx,'up')} style={{ background:'transparent', border:'none', cursor: idx===0?'default':'pointer', color:'var(--subtle-text)' }}>↑</button>
                            <button type="button" disabled={idx===(activeWorkspace.collections?.length||0)-1} onClick={() => handleReorderCollection(idx,'down')} style={{ background:'transparent', border:'none', cursor: (activeWorkspace.collections?.length||0)-1===idx?'default':'pointer', color:'var(--subtle-text)' }}>↓</button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                              style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--subtle-text)' }}
                              title="Delete collection"
                            >🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: 12 }}>Collection:</strong> {activeCollection?.name || 'None'}
                  </div>
                </div>
              </Panel>
              <Panel title={`Create Request`}>
                {activeCollection ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <RequestCollection
                      onLoad={handleLoadRequest}
                      current={{ method, url, params, headers, body, bodyType }}
                      loadedMeta={loadedRequestMeta}
                      loadedOriginal={loadedRequestOriginal}
                      workspaceContext={{
                        workspaceId: activeWorkspace.id,
                        collectionId: activeCollection?.id,
                        onPersist: persistRequestToCollection,
                        onDelete: (id) => { deleteRequestFromCollection(activeWorkspace.id, activeCollection.id, id); refreshWorkspaces(); },
                        onLog: (msg) => setLogs(l => [...l, msg])
                      }}
                      requestsSource={activeCollection?.requests}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--subtle-text)' }}>No collection selected. Create and select a collection to save requests.</div>
                )}
              </Panel>
            </div>
            {/* Right side: request top, response+logs bottom */}
            <SplitPane direction="horizontal" initialPrimarySize={380} minPrimarySize={280}>
              <div style={{ padding: 16, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
                <Panel
                  title="Request"
                  style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
                  contentStyle={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}
                >
                  {renderRequestForm()}
                </Panel>
              </div>
              <SplitPane direction="vertical" initialPrimarySize={Math.round((window.innerWidth - 360) / 2)} minPrimarySize={260}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
                  <Panel title="Response" actions={renderResponseActions()}>{renderResponseContent()}</Panel>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', boxSizing: 'border-box' }}>
                  <Panel title="Activity">{renderLogsContent()}</Panel>
                </div>
              </SplitPane>
            </SplitPane>
          </SplitPane>
        )}
      </div>
      {confirmDelete && (
        <div role="dialog" aria-modal="true" style={{ position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)', zIndex:10000 }}>
          <div style={{ background:'var(--panel-bg)', color:'var(--text-color)', border:'1px solid var(--panel-border)', borderRadius:12, padding:24, minWidth:300, boxShadow:'0 6px 24px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ fontSize:16, fontWeight:600 }}>Delete Collection</div>
            <div style={{ fontSize:13 }}>Are you sure you want to delete '<strong>{confirmDelete.name}</strong>'?</div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <Button type="button" size="sm" variant="subtle" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const prevCount = (activeWorkspace.collections?.length||0);
                  deleteCollection(activeWorkspace.id, confirmDelete.id);
                  const freshWs = ensureDefaultWorkspace();
                  setActiveWorkspaceState(freshWs);
                  setWorkspaces(loadWorkspaces());
                  if (prevCount === 1) {
                    addToast("Created default 'Main' collection");
                    setLogs(l => [...l, `Auto-created default 'Main' collection at ${new Date().toLocaleTimeString()}`]);
                  }
                  addToast(`Collection deleted: ${confirmDelete.name}`);
                  setLogs(l => [...l, `Deleted collection '${confirmDelete.name}' at ${new Date().toLocaleTimeString()}`]);
                  setConfirmDelete(null);
                  setCollectionDeletionTick(t => t + 1);
                  setInputEpoch(e => e + 1);
                }}
              >Yes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Keyboard shortcuts (outside component return but inside module scope not desired; keep in component with effect)
// Add effect after component definition? Simpler integrate inside component above return but we patch earlier for clarity.

// Add keyboard shortcut effect at end of component before export

// NOTE: Re-open component to append effect

// (We wrap logic in IIFE patch style not needed; simpler place after definition)

// Re-export unchanged

export default App;
