import React from 'react';
import { KeyValue } from '../utils/requestHelpers';

const baseInput: React.CSSProperties = {
  width: 120,
  borderRadius: 8,
  border: '1px solid var(--input-border)',
  padding: '6px 10px',
  fontSize: 14,
  background: 'var(--input-bg)',
  color: 'var(--text-color)',
  transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
};

const kvStyles: { [k: string]: React.CSSProperties } = {
  container: { marginBottom: 12 },
  label: { fontWeight: 'bold', display: 'block', marginBottom: 6, color: 'var(--text-color)', transition: 'color 0.3s ease' },
  row: { display: 'flex', gap: 8, marginBottom: 4 },
  input: baseInput,
  valueInput: { width: 180 },
  button: {
    borderRadius: 8,
    background: 'var(--button-bg)',
    color: 'var(--text-color)',
    fontSize: 14,
    padding: '6px 14px',
    border: '1px solid var(--panel-border)',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
  }
};

type Props = {
  items: KeyValue[];
  setItems: React.Dispatch<React.SetStateAction<KeyValue[]>>;
  label: string;
};

const KeyValueInputs: React.FC<Props> = ({ items, setItems, label }) => {
  return (
    <div style={kvStyles.container}>
      <strong style={kvStyles.label}>{label}</strong>
      {items.map((item, idx) => (
        <div key={idx} style={kvStyles.row}>
          <input
            type="text"
            placeholder="Key"
            value={item.key}
            onChange={e => {
              const newItems = [...items];
              newItems[idx].key = e.target.value;
              setItems(newItems);
            }}
            style={kvStyles.input}
          />
          <input
            type="text"
            placeholder="Value"
            value={item.value}
            onChange={e => {
              const newItems = [...items];
              newItems[idx].value = e.target.value;
              setItems(newItems);
            }}
            style={{ ...kvStyles.input, ...kvStyles.valueInput }}
          />
          <button type="button" style={kvStyles.button} onClick={() => {
            setItems(items.filter((_, i) => i !== idx));
          }}>Remove</button>
        </div>
      ))}
      <button type="button" style={kvStyles.button} onClick={() => setItems([...items, { key: '', value: '' }])}>Add</button>
    </div>
  );
};

export default KeyValueInputs;
