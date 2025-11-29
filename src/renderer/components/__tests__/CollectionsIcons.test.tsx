import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock prompt for rename
const originalPrompt = window.prompt;

describe('Collections edit/delete icons', () => {
  beforeEach(() => {
    window.prompt = originalPrompt;
  });

  it('renders edit and delete icons for each collection', () => {
    render(<App />);
    // Buttons exist
    expect(screen.getAllByLabelText(/rename collection/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/delete collection/i).length).toBeGreaterThan(0);
  });

  it('opens inline rename dialog on edit icon click', () => {
    render(<App />);
    const editBtns = screen.getAllByLabelText(/rename collection/i);
    fireEvent.click(editBtns[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/new collection name/i)).toBeInTheDocument();
  });
});
