import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Helper to extract inline style value for a CSS variable (since React applies variables as properties)
function getCssVar(element: HTMLElement, varName: string): string | null {
  // React sets style with keys like '--bg' accessible via style.getPropertyValue
  return element.style.getPropertyValue(varName) || null;
}

describe('Theme settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('opens settings panel when gear clicked', () => {
    const { getByTitle, getByText } = render(<App />);
    const gear = getByTitle('Settings');
    fireEvent.click(gear);
    expect(getByText('Appearance')).toBeInTheDocument();
  });

  it('slider hidden in light mode then appears auto-dim 0.8 and adjusts value', () => {
    const { getByTitle, getByLabelText, queryByLabelText, getByText } = render(<App />);
    fireEvent.click(getByTitle('Settings'));
    expect(queryByLabelText('Dim Level')).not.toBeInTheDocument();
    const heading = getByText('API Studio');
    const container = heading.parentElement as HTMLElement;
    const initialBg = getCssVar(container, '--bg');
    fireEvent.click(getByLabelText('Dark Mode'));
    const range = getByLabelText('Dim Level') as HTMLInputElement;
    expect(range.value).toBe('0.8');
    const afterBg = getCssVar(container, '--bg');
    expect(initialBg).not.toEqual(afterBg);
    fireEvent.change(range, { target: { value: '0.3' } });
    expect(range.value).toBe('0.3');
  });


  it('resets dim to 0 and hides slider when dark mode disabled', async () => {
    const { getByTitle, getByLabelText, queryByLabelText } = render(<App />);
    fireEvent.click(getByTitle('Settings'));
    fireEvent.click(getByLabelText('Dark Mode')); // enable
    // Ensure slider present
    expect(getByLabelText('Dim Level')).toBeInTheDocument();
    // Disable dark mode
    fireEvent.click(getByLabelText('Dark Mode'));
    // Wait for slider to be removed
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(queryByLabelText('Dim Level')).not.toBeInTheDocument();
  });
});
