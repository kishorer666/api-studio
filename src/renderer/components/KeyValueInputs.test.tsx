import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyValueInputs from './KeyValueInputs';

describe('KeyValueInputs', () => {
  it('renders label and input fields', () => {
    const setItems = jest.fn();
    const { getByText, getAllByPlaceholderText } = render(
      <KeyValueInputs items={[{ key: '', value: '' }]} setItems={setItems} label="Test Label" />
    );
    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getAllByPlaceholderText('Key').length).toBe(1);
    expect(getAllByPlaceholderText('Value').length).toBe(1);
  });

  it('calls setItems when Add button is clicked', () => {
    const setItems = jest.fn();
    const { getByText } = render(
      <KeyValueInputs items={[]} setItems={setItems} label="Label" />
    );
    fireEvent.click(getByText('Add'));
    expect(setItems).toHaveBeenCalled();
  });
});
