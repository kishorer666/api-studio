import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App', () => {
  it('renders main heading', () => {
    const { getByText } = render(<App />);
    expect(getByText('API Studio')).toBeInTheDocument();
  });
});
