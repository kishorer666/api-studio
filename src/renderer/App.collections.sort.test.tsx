import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import * as ws from './utils/workspaceStorage';
jest.spyOn(ws, 'collapseWorkspacesToSingle').mockImplementation(() => {
  const all = ws.loadWorkspaces();
  return all[0] ?? { id: 'ws', name: 'Default', collections: [], activeCollectionId: undefined };
});

function mkReq(id: string) { return { id, name: id, method: 'GET', url: 'https://x', params: [], headers: [], body: '', bodyType: 'application/json', favorite: false }; }

function mkCol(id: string, name: string, reqIds: string[], lastUpdated?: number) {
  return { id, name, requests: reqIds.map(mkReq), lastUpdated } as ws.Collection;
}

describe('Collections sorting in App', () => {
  beforeEach(() => {
    const workspace: ws.Workspace = {
      id: 'ws', name: 'Default', activeCollectionId: 'a',
      collections: [
        mkCol('a', 'Alpha', ['r1'], 1000),
        mkCol('b', 'Beta', ['r2','r3'], 2000),
        mkCol('c', 'Gamma', ['r4'], 1500)
      ]
    };
    ws.saveWorkspaces([workspace]);
    ws.setActiveWorkspace('ws');
  });

  it('sorts Alphabetical by name', () => {
    render(<App />);
    const select = screen.getByLabelText('Sort');
    fireEvent.change(select, { target: { value: 'alphabetical' } });
    const items = screen.getAllByRole('button', { name: /\w+ \(\d+(?: ★)?\)/ });
    const names = items.map(el => el.textContent!.split(' (')[0]);
    expect(names).toEqual(['Alpha','Beta','Gamma']);
  });

  it('sorts Recently Updated by lastUpdated desc', () => {
    render(<App />);
    const select = screen.getByLabelText('Sort');
    fireEvent.change(select, { target: { value: 'lastUpdated' } });
    const items = screen.getAllByRole('button', { name: /\w+ \(\d+(?: ★)?\)/ });
    const names = items.map(el => el.textContent!.split(' (')[0]);
    expect(names).toEqual(['Beta','Gamma','Alpha']);
  });

  it('sorts Favorites First by favorite count', () => {
    // mark one favorite in Alpha and two in Beta
    const current = ws.loadWorkspaces()[0];
    const colA = current.collections.find(c => c.id === 'a')!; colA.requests[0].favorite = true;
    const colB = current.collections.find(c => c.id === 'b')!; colB.requests[0].favorite = true; colB.requests[1].favorite = true;
    ws.saveWorkspaces([current]);

    render(<App />);
    const select = screen.getByLabelText('Sort');
    fireEvent.change(select, { target: { value: 'favoritesFirst' } });
    const items = screen.getAllByRole('button', { name: /\w+ \(\d+(?: ★)?\)/ });
    const names = items.map(el => el.textContent!.split(' (')[0]);
    expect(names).toEqual(['Beta','Alpha','Gamma']);
  });
});
