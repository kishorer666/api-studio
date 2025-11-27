import React from 'react';
import Button from './Button';
import Panel from './Panel';

const previewPanelStyle: React.CSSProperties = {
  background: 'var(--panel-bg, #f9fbfd)',
  border: '1.5px solid var(--panel-border, #dbe6f3)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(80,120,180,0.10)',
  padding: 32,
  margin: '40px auto',
  maxWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const previewButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #3575f6 0%, #6ed6ff 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(80,120,180,0.10)',
  padding: '12px 28px',
  fontWeight: 700,
  fontSize: 17,
  cursor: 'pointer',
  transition: 'background 0.2s, box-shadow 0.2s',
  outline: 'none',
  letterSpacing: '0.02em',
};

const previewSubtleButtonStyle: React.CSSProperties = {
  background: '#f2f6fa',
  color: '#3575f6',
  border: '1.5px solid #dbe6f3',
  borderRadius: 10,
  padding: '12px 28px',
  fontWeight: 600,
  fontSize: 17,
  cursor: 'pointer',
  transition: 'background 0.2s',
  outline: 'none',
};

const previewDangerButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f63557 0%, #ffb36e 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(180,80,80,0.10)',
  padding: '12px 28px',
  fontWeight: 700,
  fontSize: 17,
  cursor: 'pointer',
  transition: 'background 0.2s',
  outline: 'none',
};

export default function StylePreview() {
  return (
    <div style={previewPanelStyle}>
      <h2 style={{marginBottom:12, fontWeight:800, fontSize:24, color:'#3575f6', letterSpacing:'0.01em'}}>UI Style Preview</h2>
      <div style={{display:'flex', gap:20}}>
        <button style={previewButtonStyle} aria-label="Primary Action">Primary Button</button>
        <button style={previewSubtleButtonStyle} aria-label="Subtle Action">Subtle Button</button>
        <button style={previewDangerButtonStyle} aria-label="Danger Action">Danger Button</button>
      </div>
      <div style={{marginTop:32}}>
        <Panel title="Panel Example" style={{boxShadow:'0 2px 12px rgba(80,120,180,0.10)', borderRadius:14, border:'1.5px solid #dbe6f3', background:'#fff', padding:22}}>
          <div style={{fontSize:16, color:'#3a4a5d', fontWeight:500}}>This is a sample panel with improved separation, padding, and shadow.</div>
        </Panel>
      </div>
      <div style={{marginTop:32, borderTop:'1.5px solid #dbe6f3', paddingTop:20}}>
        <label style={{fontWeight:600, fontSize:16, color:'#3575f6'}}>Slider Example</label>
        <input type="range" min={0} max={100} style={{width:200, accentColor:'#3575f6', marginLeft:16, height:4, borderRadius:2}} />
      </div>
    </div>
  );
}
