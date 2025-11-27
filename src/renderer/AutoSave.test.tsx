import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { loadRequests } from './utils/storage';
import { ensureDefaultWorkspace, saveRequestToCollection, setActiveCollection } from './utils/workspaceStorage';

describe('Auto-save feature', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('auto-saves loaded request after inactivity', () => {
    jest.useFakeTimers();
    // Seed a saved request into the active collection
    const ws = ensureDefaultWorkspace();
    const colId = ws.activeCollectionId as string;
    saveRequestToCollection(ws.id, colId, {
      id: 'r1',
      name: 'Seed',
      method: 'GET',
      url: 'https://example.com',
      params: [],
      headers: [],
      body: '',
      bodyType: 'application/json'
    });
    setActiveCollection(ws.id, colId);
    const { getByText, getByPlaceholderText, getAllByText } = render(<App />);
    // Load the saved request
    const loadBtn = getByText('Load');
    fireEvent.click(loadBtn);
    // Change URL to trigger dirty state
    const urlInput = getByPlaceholderText('Enter request URL') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/v2' } });
    // Advance timers beyond debounce
    act(() => {
      jest.advanceTimersByTime(1600);
    });
    // Verify localStorage updated
    const updated = loadRequests().find(r => r.id === 'r1');
    expect(updated?.url).toBe('https://example.com/v2');
    // Update button should be disabled (dirty reset)
    const updateBtn = getByText('Update');
    expect(updateBtn).toBeDisabled();
    // There can be multiple auto-saved texts (heading + log). Assert at least one.
    const autoSavedEls = getAllByText(/Auto-saved/);
    expect(autoSavedEls.length).toBeGreaterThanOrEqual(1);
    jest.useRealTimers();
  });
});
