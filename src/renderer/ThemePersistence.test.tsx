import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('Theme persistence', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('writes dark mode and dim level to localStorage', () => {
    const { getByTitle, getByLabelText } = render(<App />);
    fireEvent.click(getByTitle('Settings'));
    const darkCheckbox = getByLabelText('Dark Mode') as HTMLInputElement;
    fireEvent.click(darkCheckbox);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '0.7' } });
    expect(localStorage.getItem('apiStudio.theme.dark')).toBe('true');
    expect(localStorage.getItem('apiStudio.theme.dim')).toBe('0.7');
  });

  it('reads persisted values on mount', () => {
    localStorage.setItem('apiStudio.theme.dark', 'true');
    localStorage.setItem('apiStudio.theme.dim', '0.4');
    const { getByText, getByTitle } = render(<App />);
    // Open settings to inspect current slider value
    fireEvent.click(getByTitle('Settings'));
    const heading = getByText('API Studio');
    expect(heading).toBeInTheDocument();
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider.value).toBe('0.4');
    const darkCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(darkCheckbox.checked).toBe(true);
  });
});
