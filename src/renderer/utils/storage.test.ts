import { saveRequest, loadRequests, deleteRequest, SavedRequest } from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load requests', () => {
    const req: SavedRequest = {
      id: '1',
      name: 'Test',
      method: 'GET',
      url: 'https://example.com',
      params: [{ key: 'foo', value: 'bar' }],
      headers: [{ key: 'x', value: 'y' }],
      body: '',
      bodyType: 'application/json',
    };
    saveRequest(req);
    const loaded = loadRequests();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject(req);
  });

  it('should overwrite request with same id', () => {
    const req1: SavedRequest = {
      id: '1', name: 'A', method: 'GET', url: 'u', params: [], headers: [], body: '', bodyType: 'application/json', };
    const req2: SavedRequest = { ...req1, name: 'B' };
    saveRequest(req1);
    saveRequest(req2);
    const loaded = loadRequests();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('B');
  });

  it('should delete request by id', () => {
    const req: SavedRequest = {
      id: '1', name: 'A', method: 'GET', url: 'u', params: [], headers: [], body: '', bodyType: 'application/json', };
    saveRequest(req);
    deleteRequest('1');
    const loaded = loadRequests();
    expect(loaded).toHaveLength(0);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('apiStudioRequests', 'not-json');
    expect(loadRequests()).toEqual([]);
  });
});
