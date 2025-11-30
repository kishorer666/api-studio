import { platformAdapter } from '../platform/PlatformAdapter';
import { SavedRequest } from './storage';

export interface Collection {
  id: string;
  name: string;
  requests: SavedRequest[];
  lastUpdated?: number;
}

export interface Workspace {
  id: string;
  name: string;
  collections: Collection[];
  activeCollectionId?: string;
}

const WS_KEY = 'apiStudio.workspaces';
const ACTIVE_WS_KEY = 'apiStudio.activeWorkspace';

function storage() { return platformAdapter.storage(); }

export function loadWorkspaces(): Workspace[] {
  try {
    const raw = storage().getItem(WS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch { return []; }
}

export function saveWorkspaces(workspaces: Workspace[]) {
  storage().setItem(WS_KEY, JSON.stringify(workspaces));
}

export function getActiveWorkspaceId(): string | null {
  return storage().getItem(ACTIVE_WS_KEY);
}

export function setActiveWorkspace(id: string) {
  storage().setItem(ACTIVE_WS_KEY, id);
}

export function ensureDefaultWorkspace(): Workspace {
  const all = loadWorkspaces();
  if (all.length === 0) {
    const ws: Workspace = {
      id: Date.now().toString(),
      name: 'Default',
      collections: [ { id: 'col-'+Date.now().toString(), name: 'Main', requests: [], } ],
      activeCollectionId: undefined
    };
    ws.activeCollectionId = ws.collections[0].id;
    saveWorkspaces([ws]);
    setActiveWorkspace(ws.id);
    return ws;
  }
  const activeId = getActiveWorkspaceId() || all[0].id;
  setActiveWorkspace(activeId);
  return all.find(w => w.id === activeId) || all[0];
}

export function addWorkspace(name: string): Workspace {
  const all = loadWorkspaces();
  const id = Date.now().toString();
  const defaultCol: Collection = { id: 'col-'+id, name: 'Main', requests: [] };
  const ws: Workspace = { id, name, collections: [defaultCol], activeCollectionId: defaultCol.id };
  saveWorkspaces([...all, ws]);
  setActiveWorkspace(ws.id);
  return ws;
}

export function addCollection(workspaceId: string, name: string): Collection | null {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return null;
  // Prevent duplicate collection names (case-insensitive)
  const exists = (ws.collections || []).some(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return null;
  }
  const col: Collection = { id: 'col-'+Date.now().toString(), name, requests: [] };
  ws.collections.push(col);
  ws.activeCollectionId = col.id;
  saveWorkspaces(all);
  return col;
}

export function setActiveCollection(workspaceId: string, collectionId: string) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return;
  ws.activeCollectionId = collectionId;
  saveWorkspaces(all);
}

export function saveRequestToCollection(workspaceId: string, collectionId: string, request: SavedRequest) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return;
  const col = ws.collections.find(c => c.id === collectionId);
  if (!col) return;
  col.requests = [...col.requests.filter(r => r.id !== request.id), request];
  col.lastUpdated = Date.now();
  saveWorkspaces(all);
}

export function deleteRequestFromCollection(workspaceId: string, collectionId: string, requestId: string) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return;
  const col = ws.collections.find(c => c.id === collectionId);
  if (!col) return;
  col.requests = col.requests.filter(r => r.id !== requestId);
  col.lastUpdated = Date.now();
  saveWorkspaces(all);
}

export function deleteCollection(workspaceId: string, collectionId: string) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return;
  ws.collections = (ws.collections || []).filter(c => c.id !== collectionId);
  // Adjust activeCollectionId if needed
  if (ws.activeCollectionId === collectionId) {
    ws.activeCollectionId = ws.collections[0]?.id;
  }
  // Ensure at least one collection exists to keep UI functional
  if (!ws.collections || ws.collections.length === 0) {
    const newId = 'col-' + Date.now().toString();
    const defaultCol: Collection = { id: newId, name: 'Main', requests: [] };
    ws.collections = [defaultCol];
    ws.activeCollectionId = newId;
  }
  saveWorkspaces(all);
  // Safety: run cleanup to resolve any residual duplicates or inconsistencies
  try { cleanupWorkspaces(); } catch {/* ignore */}
}

export function toggleFavoriteInCollection(workspaceId: string, collectionId: string, requestId: string, favorite: boolean) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId); if (!ws) return;
  const col = ws.collections.find(c => c.id === collectionId); if (!col) return;
  col.requests = col.requests.map(r => r.id === requestId ? { ...r, favorite } : r);
  saveWorkspaces(all);
}

export function renameWorkspace(workspaceId: string, newName: string) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId); if (!ws) return;
  ws.name = newName;
  saveWorkspaces(all);
}

export function renameCollection(workspaceId: string, collectionId: string, newName: string): boolean {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId); if (!ws) return false;
  const dup = (ws.collections || []).some(c => c.id !== collectionId && (c.name || '').trim().toLowerCase() === newName.trim().toLowerCase());
  if (dup) return false;
  const col = (ws.collections || []).find(c => c.id === collectionId); if (!col) return false;
  col.name = newName.trim();
  saveWorkspaces(all);
  return true;
}

export function deleteWorkspace(workspaceId: string) {
  const all = loadWorkspaces();
  const remaining = all.filter(w => w.id !== workspaceId);
  if (remaining.length === 0) return; // keep at least one
  saveWorkspaces(remaining);
  setActiveWorkspace(remaining[0].id);
}

export function reorderCollections(workspaceId: string, fromIndex: number, toIndex: number) {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId); if (!ws) return;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= ws.collections.length || toIndex >= ws.collections.length) return;
  const cols = [...ws.collections];
  const [moved] = cols.splice(fromIndex, 1);
  cols.splice(toIndex, 0, moved);
  ws.collections = cols;
  saveWorkspaces(all);
}

export function exportWorkspace(workspaceId: string): string | null {
  const ws = loadWorkspaces().find(w => w.id === workspaceId);
  if (!ws) return null;
  return JSON.stringify(ws, null, 2);
}

export function importWorkspace(json: string) {
  try {
    const ws = JSON.parse(json) as Workspace;
    if (!ws || !ws.id || !ws.name) return false;
    // assign new ids to avoid collisions
    const newId = Date.now().toString();
    ws.id = newId;
    ws.collections = (ws.collections || []).map(c => ({ ...c, id: 'col-'+Date.now().toString()+Math.random().toString(16).slice(2) }));
    ws.activeCollectionId = ws.collections[0]?.id;
    const all = loadWorkspaces();
    saveWorkspaces([...all, ws]);
    setActiveWorkspace(ws.id);
    return true;
  } catch { return false; }
}

// Export a single collection to JSON
export function exportCollection(workspaceId: string, collectionId: string): string | null {
  const ws = loadWorkspaces().find(w => w.id === workspaceId);
  if (!ws) return null;
  const col = (ws.collections || []).find(c => c.id === collectionId);
  if (!col) return null;
  return JSON.stringify({ name: col.name, requests: col.requests }, null, 2);
}

// Import a collection JSON and add/merge into the workspace
export function importCollection(workspaceId: string, json: string): boolean {
  try {
    const data = JSON.parse(json) as { name?: string; requests?: SavedRequest[] };
    if (!data || !data.name || !Array.isArray(data.requests)) return false;
    const all = loadWorkspaces();
    const ws = all.find(w => w.id === workspaceId);
    if (!ws) return false;
    const key = data.name.trim().toLowerCase();
    let target = (ws.collections || []).find(c => c.name.trim().toLowerCase() === key);
    if (!target) {
      target = { id: 'col-'+Date.now().toString(), name: data.name.trim(), requests: [] };
      ws.collections.push(target);
      ws.activeCollectionId = target.id;
    }
    // Namespace ids per collection to preserve identity within the collection and avoid cross-collection collisions
    const existingIds = new Set((target.requests || []).map(r => r.id));
    (data.requests || []).forEach(r => {
      if (!r) return;
      const namespacedId = `${target!.id}::${r.id || ''}`;
      const newReq: SavedRequest = { ...r, id: namespacedId };
      if (!existingIds.has(newReq.id)) {
        target!.requests.push(newReq);
        existingIds.add(newReq.id);
      }
    });
    target.lastUpdated = Date.now();
    saveWorkspaces(all);
    return true;
  } catch { return false; }
}

// Import a collection using a provided name, creating a new collection (no merge). Returns new collection id on success.
export function importCollectionWithName(workspaceId: string, name: string, requests: SavedRequest[]): { ok: boolean; id?: string } {
  const all = loadWorkspaces();
  const ws = all.find(w => w.id === workspaceId);
  if (!ws) return { ok: false };
  const dup = (ws.collections || []).some(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (dup) return { ok: false };
  const id = 'col-' + Date.now().toString();
  const col: Collection = {
    id,
    name: name.trim(),
    requests: Array.isArray(requests)
      ? requests.map(r => ({
          ...r,
          id: `${id}::${r.id || ''}`
        }))
      : []
  };
  ws.collections.push(col);
  ws.activeCollectionId = id;
  saveWorkspaces(all);
  return { ok: true, id };
}

// Maintenance: remove duplicate collections (case-insensitive) by name and merge requests
export function cleanupWorkspaces() {
  const all = loadWorkspaces();
  let changed = false;
  const normalized = all.map(ws => {
    const map = new Map<string, Collection>();
    const result: Collection[] = [];
    (ws.collections || []).forEach(col => {
      const key = (col.name || '').trim().toLowerCase();
      if (!map.has(key)) {
        // first occurrence
        const base: Collection = { id: col.id, name: col.name, requests: [...(col.requests || [])] };
        map.set(key, base);
        result.push(base);
      } else {
        // duplicate name: merge requests by id
        const target = map.get(key)!;
        const existingIds = new Set((target.requests || []).map(r => r.id));
        (col.requests || []).forEach(r => {
          if (!existingIds.has(r.id)) {
            target.requests.push(r);
            changed = true;
          }
        });
        changed = true;
      }
    });
    // ensure activeCollectionId points to a valid collection
    if (!result.find(c => c.id === ws.activeCollectionId)) {
      ws.activeCollectionId = result[0]?.id;
      if (result.length > 0) changed = true;
    }
    return { ...ws, collections: result } as Workspace;
  });
  if (changed) {
    saveWorkspaces(normalized);
  }
}

// Collapse all workspaces into a single workspace by merging collections.
// Keeps the first workspace's id/name, merges collections by name (case-insensitive),
// and de-duplicates requests by id.
export function collapseWorkspacesToSingle(): Workspace {
  const all = loadWorkspaces();
  let base: Workspace;
  if (all.length === 0) {
    base = ensureDefaultWorkspace();
    return base;
  }
  base = { ...all[0], collections: [...(all[0].collections || [])] };
  const map = new Map<string, Collection>();
  const merged: Collection[] = [];
  const pushCol = (col: Collection) => {
    const key = (col.name || '').trim().toLowerCase();
    if (!map.has(key)) {
      const c: Collection = { id: col.id, name: col.name, requests: [...(col.requests || [])] };
      map.set(key, c);
      merged.push(c);
    } else {
      const target = map.get(key)!;
      const existingIds = new Set((target.requests || []).map(r => r.id));
      (col.requests || []).forEach(r => { if (!existingIds.has(r.id)) target.requests.push(r); });
    }
  };
  all.forEach(ws => (ws.collections || []).forEach(pushCol));
  base.collections = merged;
  base.activeCollectionId = merged[0]?.id;
  saveWorkspaces([base]);
  setActiveWorkspace(base.id);
  return base;
}
