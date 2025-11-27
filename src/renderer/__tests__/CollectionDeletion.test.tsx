import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Basic regression test: deleting the last collection should immediately recreate a default collection
// and keep the collection creation and request form inputs enabled without requiring window refocus.

describe('Collection deletion stability', () => {
  beforeEach(() => {
    // Ensure clean localStorage between tests
    localStorage.clear();
  });

  test('deleting last collection via overlay confirmation keeps inputs enabled immediately', async () => {

    render(<App />);

    const collectionInput = await screen.findByPlaceholderText('Collection name');
    // Fallback enable assertion without jest-dom matcher
    expect((collectionInput as HTMLInputElement).disabled).toBeFalsy();

    // Create a collection
    fireEvent.change(collectionInput, { target: { value: 'Temp' } });
    const createBtn = screen.getByRole('button', { name: /create collection/i });
    fireEvent.click(createBtn);

    // Temp collection appears; initiate deletion (opens overlay)
    const deleteBtns = await screen.findAllByTitle(/Delete collection/);
    const targetDelete = deleteBtns[deleteBtns.length - 1];
    fireEvent.click(targetDelete);
    // Overlay should appear
    const dialog = await screen.findByRole('dialog');
    // Basic presence assertion without jest-dom matcher
    expect(dialog).not.toBeNull();
    // Confirm deletion by clicking Yes
    const yesBtn = screen.getByRole('button', { name: /^yes$/i });
    fireEvent.click(yesBtn);

    // After deletion, default Main collection should appear quickly (may render label + button)
    await waitFor(() => {
      const mainMatches = screen.getAllByText(/Main/);
      expect(mainMatches.length).toBeGreaterThan(0);
    });

    // Inputs remain enabled
    expect((collectionInput as HTMLInputElement).disabled).toBeFalsy();

    // Request URL input should also be enabled for immediate use
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    expect((urlInput as HTMLInputElement).disabled).toBeFalsy();

    // No confirm spy to restore
  });
});
