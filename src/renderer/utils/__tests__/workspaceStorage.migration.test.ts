import { loadWorkspaces, saveWorkspaces, collapseWorkspacesToSingle, Workspace, Collection } from '../workspaceStorage';

function mkReq(id: string) { return { id, name: id, method: 'GET', url: 'https://x', params: [], headers: [], body: '', bodyType: 'application/json' }; }

describe('collapseWorkspacesToSingle', () => {
  beforeEach(() => {
    const ws1: Workspace = {
      id: 'ws1', name: 'Default', activeCollectionId: 'c1',
      collections: [ { id: 'c1', name: 'Main', requests: [mkReq('r1')] } ]
    };
    const ws2: Workspace = {
      id: 'ws2', name: 'NEM', activeCollectionId: 'c2',
      collections: [ { id: 'c2', name: 'Main', requests: [mkReq('r2'), mkReq('r1')] }, { id: 'c3', name: 'Extra', requests: [mkReq('r3')] } ]
    };
    saveWorkspaces([ws1, ws2]);
  });

  it('merges collections by name and de-duplicates requests', () => {
    const result = collapseWorkspacesToSingle();
    const all = loadWorkspaces();
    expect(all).toHaveLength(1);
    const ws = all[0];
    expect(ws.collections.length).toBe(2);
    const main = ws.collections.find(c => c.name.toLowerCase() === 'main') as Collection;
    const extra = ws.collections.find(c => c.name.toLowerCase() === 'extra') as Collection;
    expect(main.requests.map(r => r.id).sort()).toEqual(['r1','r2']);
    expect(extra.requests.map(r => r.id).sort()).toEqual(['r3']);
    expect(ws.activeCollectionId).toBeDefined();
  });
});
