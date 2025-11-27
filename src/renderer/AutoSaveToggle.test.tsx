import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { ensureDefaultWorkspace, saveRequestToCollection, setActiveCollection, loadWorkspaces } from './utils/workspaceStorage';

// Test that disabling auto-save prevents automatic persistence of edits
// and enabling (default) still works (covered by existing AutoSave.test).

describe('Auto-save toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not auto-save when disabled', () => {
    // Seed a saved request into the active collection
    const ws = ensureDefaultWorkspace();
    const colId = ws.activeCollectionId as string;
    saveRequestToCollection(ws.id, colId, {
      id: 't1',
      name: 'ToggleSeed',
      method: 'GET',
      url: 'https://example.com',
      params: [],
      headers: [],
      body: '',
      bodyType: 'application/json'
    });
    setActiveCollection(ws.id, colId);
    jest.useFakeTimers();
    const { getByTitle, getByText, getByPlaceholderText, getByLabelText } = render(<App />);
    // Load request
    fireEvent.click(getByText('Load'));
    // Disable auto-save
    fireEvent.click(getByTitle('Settings'));
    const toggle = getByLabelText('Auto-save loaded requests');
    expect(toggle).toBeChecked();
    fireEvent.click(toggle); // uncheck
    expect(toggle).not.toBeChecked();
    // Modify URL
    const urlInput = getByPlaceholderText('Enter request URL') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/changed' } });
    // Advance timers beyond debounce
    act(() => { jest.advanceTimersByTime(2000); });
    // Verify saved request NOT updated in collection storage
    const wsAfter = loadWorkspaces()[0];
    const colAfter = wsAfter.collections.find(c => c.id === colId)!;
    const stored = (colAfter.requests || []).find(r => r.id === 't1');
    expect(stored?.url).toBe('https://example.com');
    // Heading should show auto-save off indicator
    expect(getByText(/Auto-save off/)).toBeInTheDocument();
    jest.useRealTimers();
  });
});
