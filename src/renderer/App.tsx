import React, { useState, useEffect, useRef, useMemo } from 'react';
import Panel from './components/Panel';
import { SavedRequest, saveRequest } from './utils/storage';
import KeyValueInputs from './components/KeyValueInputs';
import RequestCollection from './components/RequestCollection';
import { buildQueryString, buildHeaders, KeyValue } from './utils/requestHelpers';

// Inline styles using CSS variables for theming
const styles: { [k: string]: React.CSSProperties | string } = {
  container: {
    width: 'clamp(320px, 95%, 1200px)',
    margin: '40px auto',
    fontFamily: 'Arial, Helvetica, sans-serif',
    background: 'var(--bg)',
    borderRadius: 18,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '32px 40px',
    minHeight: 600,
    border: '1px solid var(--panel-border)',
    boxSizing: 'border-box',
    color: 'var(--text-color)',
    transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
  },
  heading: {
    fontWeight: 700,
    fontSize: 32,
    marginBottom: 24,
    color: 'var(--text-color)',
    letterSpacing: -1,
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
  const [prettyResponse, setPrettyResponse] = useState(true);
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [dimLevel, setDimLevel] = useState(0); // 0..1
  const [showSettings, setShowSettings] = useState(false);
  const themeVars = useMemo(() => computeTheme(isDark, dimLevel), [isDark, dimLevel]);
  // Auto-save status
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const AUTO_SAVE_DELAY = 1500; // ms inactivity

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
    if (!loadedRequestMeta || !loadedRequestOriginal) return; // only autosave for already saved request
    const dirty = computeDirty();
    if (!dirty) {
      // Clear pending timer if state reverted
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }
    // Reset existing timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = window.setTimeout(() => {
      // Perform auto-save
      try {
        const req: SavedRequest = {
          id: loadedRequestMeta.id,
          name: loadedRequestMeta.name,
          method,
          url,
          params: params.map(kv => ({ ...kv })),
          headers: headers.map(kv => ({ ...kv })),
          body,
          bodyType
        };
        // Direct storage update
        saveRequest(req);
        // Refresh snapshot baseline
        setLoadedRequestOriginal({ ...req, params: req.params.map(kv => ({ ...kv })), headers: req.headers.map(kv => ({ ...kv })) });
        setLogs(l => [...l, `Auto-saved request '${req.name}' at ${new Date().toLocaleTimeString()}`]);
        setLastAutoSave(new Date().toLocaleTimeString());
      } catch (e:any) {
        setLogs(l => [...l, `Auto-save failed: ${e.message}`]);
      }
      autoSaveTimerRef.current = null;
    }, AUTO_SAVE_DELAY);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [method, url, params, headers, body, bodyType, loadedRequestMeta, loadedRequestOriginal]);

  // Load persisted theme preferences once
  useEffect(() => {
    try {
      const persistedDark = localStorage.getItem('apiStudio.theme.dark');
      const persistedDim = localStorage.getItem('apiStudio.theme.dim');
      if (persistedDark === 'true') setIsDark(true);
      if (persistedDark === 'false') setIsDark(false);
      if (persistedDim) {
        const v = parseFloat(persistedDim);
        if (!isNaN(v)) setDimLevel(Math.min(1, Math.max(0, v)));
      }
    } catch {/* ignore */}
  }, []);

  // Persist when changed
  useEffect(() => {
    try {
      localStorage.setItem('apiStudio.theme.dark', String(isDark));
      localStorage.setItem('apiStudio.theme.dim', String(dimLevel));
    } catch {/* ignore */}
  }, [isDark, dimLevel]);
  // Responsive breakpoint handling
  const [isNarrow, setIsNarrow] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1000 : false);
  // Resizable left panel width
  const [leftWidth, setLeftWidth] = useState<number>(380);
  const draggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(leftWidth);
  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 1000);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Mouse move / up listeners for resizing
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const delta = e.clientX - startXRef.current;
      let newWidth = startWidthRef.current + delta;
      const min = 260;
      const max = Math.min(rect.width - 320, 600); // ensure right side stays usable
      if (newWidth < min) newWidth = min;
      if (newWidth > max) newWidth = max;
      setLeftWidth(newWidth);
    };
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if (isNarrow) return; // disable drag in narrow mode
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    e.preventDefault();
  };

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div ref={containerRef} style={{ ...styles.container as React.CSSProperties, ...themeVars }}>
      <h1 style={styles.heading as React.CSSProperties}>API Studio {lastAutoSave && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 12, color: 'var(--subtle-text)' }}>Auto-saved {lastAutoSave}</span>}</h1>
      <button
        type="button"
        onClick={() => setShowSettings(s => !s)}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          padding: '6px 10px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          color: 'var(--text-color)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
        }}
        title="Settings"
      >⚙️</button>
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 24,
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
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            style={{
              ...styles.button as React.CSSProperties,
              fontSize: 14,
              padding: '6px 10px'
            }}
          >Close</button>
        </div>
      )}
      <div
        style={
          isNarrow
            ? { display: 'block' }
            : {
                display: 'flex',
                alignItems: 'stretch',
                width: '100%',
                gap: 0
              }
        }
      >
        <div style={ isNarrow ? { display: 'flex', flexDirection: 'column', gap: 16 } : { width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 12 } }>
          <Panel title="Saved Requests">
            <RequestCollection
              onLoad={handleLoadRequest}
              current={{ method, url, params, headers, body, bodyType }}
              loadedMeta={loadedRequestMeta}
              loadedOriginal={loadedRequestOriginal}
            />
          </Panel>
          <Panel title="Request">
            <form onSubmit={sendRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  required
                />
                <div style={{ display: 'flex', flex: '0 0 auto' }}>
                  <button
                    type="submit"
                    disabled={loading || !url}
                    style={{ ...(styles.button as React.CSSProperties), whiteSpace: 'nowrap' }}
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
              <Panel
                title="Query Parameters"
                scroll
                maxContentHeight={200}
                collapsed={collapseParams}
                onToggleCollapse={() => setCollapseParams(c => !c)}
              >
                <KeyValueInputs items={params} setItems={setParams} label="" />
              </Panel>
              <Panel
                title="Headers"
                scroll
                maxContentHeight={200}
                collapsed={collapseHeaders}
                onToggleCollapse={() => setCollapseHeaders(c => !c)}
              >
                <KeyValueInputs items={headers} setItems={setHeaders} label="" />
              </Panel>
              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <Panel
                  title="Body"
                  scroll
                  maxContentHeight={300}
                  collapsed={collapseBody}
                  onToggleCollapse={() => setCollapseBody(c => !c)}
                >
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
                      style={styles.textarea as React.CSSProperties}
                    />
                  </div>
                </Panel>
              )}
            </form>
          </Panel>
        </div>
        {!isNarrow && (
          <div
            onMouseDown={startDrag}
            style={{
              width: 6,
              cursor: 'col-resize',
              background: 'linear-gradient(to bottom, #e0e0e0, #cfd3d7)',
              borderLeft: '1px solid #d1d5db',
              borderRight: '1px solid #d1d5db',
              margin: '0 4px',
              borderRadius: 3,
              transition: 'background 0.15s',
              position: 'relative'
            }}
            title="Drag to resize"
          />
        )}
        <div style={ isNarrow ? { display: 'flex', flexDirection: 'column', gap: 16 } : { flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 } }>
          <Panel
            title="Response"
            actions={
              <button
                type="button"
                onClick={() => setPrettyResponse(p => !p)}
                style={{
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'var(--text-color)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'background-color 0.35s, color 0.35s, border-color 0.35s'
                }}
                title={prettyResponse ? 'Show raw' : 'Show pretty'}
              >
                {prettyResponse ? 'Raw' : 'Pretty'}
              </button>
            }
          >
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
          </Panel>
          <Panel title="Logs">
            <pre style={{ ...(styles.panel as React.CSSProperties), maxHeight: 200 }}>
              {logs.join('\n')}
            </pre>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default App;
