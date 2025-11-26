import React from 'react';

const style: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#555',
  margin: '4px 0'
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={style}>{children}</div>
);

export default SectionTitle;