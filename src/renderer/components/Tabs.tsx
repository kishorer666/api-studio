import React from 'react';

interface TabDefinition {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabDefinition[];
  activeId: string;
  onChange: (id: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', gap: 4 }}>
        {tabs.map(t => {
          const active = t.id === activeId;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => onChange(t.id)}
              data-focusable
              style={{
                background: active ? 'var(--panel-bg)' : 'transparent',
                border: '1px solid var(--panel-border)',
                borderBottom: active ? '2px solid var(--accent)' : '1px solid var(--panel-border)',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: 'var(--text-color)',
                transition: 'background 0.25s, color 0.25s'
              }}
            >{t.label}</button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingTop: 8 }}>
        {tabs.find(t => t.id === activeId)?.content}
      </div>
    </div>
  );
};

export default Tabs;