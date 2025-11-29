import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../renderer/App';

// Helper to select active collection if needed (app creates default workspace/collection)

describe('Collection create error dialog', () => {
  it('shows error dialog when collection name is empty', () => {
    render(<App />);
    const createBtn = screen.getByRole('button', { name: /create collection/i });
    fireEvent.click(createBtn);
    // Should show styled dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/please enter a collection name/i)).toBeInTheDocument();
    // Close
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows duplicate dialog when name already exists', () => {
    render(<App />);
    const nameInput = screen.getByPlaceholderText('Collection name');
    fireEvent.change(nameInput, { target: { value: 'Main' } });
    const createBtn = screen.getByRole('button', { name: /create collection/i });
    fireEvent.click(createBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });
});
