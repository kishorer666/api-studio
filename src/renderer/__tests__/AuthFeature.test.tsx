import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../renderer/App';

// Mock fetch
const mockFetch = jest.fn(async () => ({
  status: 200,
  text: async () => 'ok',
} as any));

describe('Auth feature', () => {
  beforeEach(() => {
    (global as any).fetch = mockFetch;
    mockFetch.mockClear();
  });

  it('applies Bearer token to Authorization header', async () => {
    render(<App />);
    // Enter URL
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/users' } });

    // Switch to Auth tab
    const authTabBtn = screen.getByRole('button', { name: /auth/i });
    fireEvent.click(authTabBtn);
    const authSelect = screen.getByLabelText('Auth');
    fireEvent.change(authSelect, { target: { value: 'bearer' } });

    const tokenInput = screen.getByPlaceholderText('Token');
    fireEvent.change(tokenInput, { target: { value: 'my-token' } });

    // Send
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const call: any[] = (mockFetch.mock.calls as any[])[0];
    const opts = call[1];
    expect(opts.headers.Authorization).toBe('Bearer my-token');
  });

  it('applies Basic auth header from username/password', async () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/users' } });

    const authTabBtn = screen.getByRole('button', { name: /auth/i });
    fireEvent.click(authTabBtn);
    const authSelect = screen.getByLabelText('Auth');
    fireEvent.change(authSelect, { target: { value: 'basic' } });

    const userInput = screen.getByPlaceholderText('Username');
    const passInput = screen.getByPlaceholderText('Password');
    fireEvent.change(userInput, { target: { value: 'alice' } });
    fireEvent.change(passInput, { target: { value: 'secret' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const call: any[] = (mockFetch.mock.calls as any[])[0];
    const opts = call[1];
    expect(opts.headers.Authorization).toMatch(/^Basic\s+/);
  });

  it('appends API Key to query when location=query', async () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/users' } });

    const authTabBtn = screen.getByRole('button', { name: /auth/i });
    fireEvent.click(authTabBtn);
    const authSelect = screen.getByLabelText('Auth');
    fireEvent.change(authSelect, { target: { value: 'apikey' } });

    const nameInput = screen.getByPlaceholderText('Key name (e.g., X-API-Key)');
    const valueInput = screen.getByPlaceholderText('Value');
    fireEvent.change(nameInput, { target: { value: 'api_key' } });
    fireEvent.change(valueInput, { target: { value: '123' } });

    const locSelect = screen.getByDisplayValue('Header');
    fireEvent.change(locSelect, { target: { value: 'query' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const call: any[] = (mockFetch.mock.calls as any[])[0];
    const urlCalled = call[0];
    expect(String(urlCalled)).toMatch(/api_key=123/);
  });

  it('applies API Key as header when location=header', async () => {
    render(<App />);
    const urlInput = screen.getByPlaceholderText('Enter request URL');
    fireEvent.change(urlInput, { target: { value: 'https://api.example.com/users' } });

    const authTabBtn = screen.getByRole('button', { name: /auth/i });
    fireEvent.click(authTabBtn);
    const authSelect = screen.getByLabelText('Auth');
    fireEvent.change(authSelect, { target: { value: 'apikey' } });

    const nameInput = screen.getByPlaceholderText('Key name (e.g., X-API-Key)');
    const valueInput = screen.getByPlaceholderText('Value');
    fireEvent.change(nameInput, { target: { value: 'X-API-Key' } });
    fireEvent.change(valueInput, { target: { value: 'abc' } });

    // Header is default
    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const call: any[] = (mockFetch.mock.calls as any[])[0];
    const opts = call[1];
    expect(opts.headers['X-API-Key']).toBe('abc');
  });
});
