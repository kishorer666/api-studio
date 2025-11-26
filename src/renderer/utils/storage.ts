export type SavedRequest = {
  id: string;
  name: string;
  method: string;
  url: string;
  params: { key: string; value: string }[];
  headers: { key: string; value: string }[];
  body: string;
  bodyType: string;
};

const STORAGE_KEY = 'apiStudioRequests';

export function saveRequest(request: SavedRequest) {
  const existing = loadRequests();
  const updated = [...existing.filter(r => r.id !== request.id), request];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function loadRequests(): SavedRequest[] {
  const raw = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
