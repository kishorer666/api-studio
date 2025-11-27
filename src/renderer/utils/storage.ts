export type SavedRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  params: { key: string; value: string }[];
  headers: { key: string; value: string }[];
  body: string;
  bodyType: string;
  favorite?: boolean; // optional favorite flag
};

const STORAGE_KEY = 'apiStudioRequests';
// Lazy import to avoid circular dependency when bundled; platformAdapter is safe singleton.
import { platformAdapter } from '../platform/PlatformAdapter';
function store() { return platformAdapter.storage(); }

function sanitizeKV(arr: { key: string; value: string }[]) {
  return arr.filter(kv => kv.key.trim() !== '' || kv.value.trim() !== '');
}

export function saveRequest(request: SavedRequest) {
  const sanitized: SavedRequest = { ...request, params: sanitizeKV(request.params), headers: sanitizeKV(request.headers) };
  const existing = loadRequests();
  const updated = [...existing.filter(r => r.id !== sanitized.id), sanitized];
  store().setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function toggleFavorite(id: string, favorite: boolean) {
  const existing = loadRequests();
  const updated = existing.map(r => r.id === id ? { ...r, favorite } : r);
  store().setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function loadRequests(): SavedRequest[] {
  const raw = store().getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function deleteRequest(id: string) {
  const existing = loadRequests();
  const updated = existing.filter(r => r.id !== id);
  store().setItem(STORAGE_KEY, JSON.stringify(updated));
}
