import { saveWorkspaces, loadWorkspaces, saveRequestToCollection, deleteRequestFromCollection, Workspace, Collection } from '../workspaceStorage';

const mkReq = (id: string) => ({ id, name: id, method: 'GET', url: 'https://x', params: [], headers: [], body: '', bodyType: 'application/json' });

describe('collection lastUpdated', () => {
  beforeEach(() => {
    const ws: Workspace = {
      id: 'ws', name: 'Default', activeCollectionId: 'c1',
      collections: [ { id: 'c1', name: 'Main', requests: [mkReq('r1')] } ]
    };
    saveWorkspaces([ws]);
  });

  it('updates lastUpdated on saveRequestToCollection', () => {
    const before = Date.now();
    saveRequestToCollection('ws', 'c1', mkReq('r2'));
    const c = loadWorkspaces()[0].collections.find(c => c.id === 'c1') as Collection;
    expect(c.lastUpdated).toBeDefined();
    expect((c.lastUpdated as number)).toBeGreaterThanOrEqual(before);
    expect(c.requests.map(r => r.id).sort()).toEqual(['r1','r2']);
  });

  it('updates lastUpdated on deleteRequestFromCollection', () => {
    const before = Date.now();
    deleteRequestFromCollection('ws', 'c1', 'r1');
    const c = loadWorkspaces()[0].collections.find(c => c.id === 'c1') as Collection;
    expect(c.lastUpdated).toBeDefined();
    expect((c.lastUpdated as number)).toBeGreaterThanOrEqual(before);
    expect(c.requests.map(r => r.id)).toEqual([]);
  });
});
