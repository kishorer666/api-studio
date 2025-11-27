import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { ensureDefaultWorkspace, saveRequestToCollection, setActiveCollection } from './utils/workspaceStorage';

describe('Auto-save pending indicator', () => {
  beforeEach(() => { localStorage.clear(); });

  it('shows Saving… during debounce then Auto-saved after completion', () => {
    const ws = ensureDefaultWorkspace();
    const colId = ws.activeCollectionId as string;
    saveRequestToCollection(ws.id, colId, {
      id: 'p1',
      name: 'PendingSeed',
      method: 'GET',
      url: 'https://example.com',
      params: [],
      headers: [],
      body: '',
      bodyType: 'application/json'
    });
    setActiveCollection(ws.id, colId);
    jest.useFakeTimers();
    const { getByText, getByPlaceholderText } = render(<App />);
    fireEvent.click(getByText('Load'));
    const urlInput = getByPlaceholderText('Enter request URL');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/changed' } });
    // Indicator should show Saving… before timer completes
    expect(getByText(/Saving…/)).toBeInTheDocument();
    // Advance just before completion to ensure still pending
    act(() => { jest.advanceTimersByTime(1400); });
    expect(getByText(/Saving…/)).toBeInTheDocument();
    // Complete timer
    act(() => { jest.advanceTimersByTime(200); });
    // Now should show Auto-saved
    const autoSavedEls = document.querySelectorAll('span');
    const headingSpan = Array.from(autoSavedEls).find(el => /Auto-saved/.test(el.textContent || ''));
    expect(headingSpan).toBeTruthy();
    jest.useRealTimers();
  });
});
