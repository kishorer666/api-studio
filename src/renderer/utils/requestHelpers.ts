export type KeyValue = { key: string; value: string };

export const buildQueryString = (params: KeyValue[]): string => {
  const esc = encodeURIComponent;
  return params
    .filter(p => p.key)
    .map(p => `${esc(p.key)}=${esc(p.value)}`)
    .join('&');
};

export const buildHeaders = (headers: KeyValue[]): Record<string, string> => {
  const obj: Record<string, string> = {};
  headers.forEach(h => {
    if (h.key) obj[h.key] = h.value;
  });
  return obj;
};
