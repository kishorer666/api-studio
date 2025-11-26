import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties; // style applied to content wrapper
  scroll?: boolean; // if true, makes content scrollable within a max height
  maxContentHeight?: number; // sets max height for scrollable content
  collapsed?: boolean; // externally controlled collapsed state
  onToggleCollapse?: () => void; // handler for collapse toggle
}

const baseStyle: React.CSSProperties = {
  background: 'var(--panel-bg)',
  border: '1px solid var(--panel-border)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  maxWidth: '100%',
  boxSizing: 'border-box',
  transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--text-color)'
};

const Panel: React.FC<PanelProps> = ({
  title,
  children,
  actions,
  style,
  contentStyle,
  scroll,
  maxContentHeight,
  collapsed = false,
  onToggleCollapse,
}) => {
  const computedContentStyle: React.CSSProperties = {
    width: '100%',
    ...(scroll
      ? {
          overflowY: 'auto',
          maxHeight: maxContentHeight || 240,
          paddingRight: 4,
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }
      : {}),
    ...contentStyle,
  };
  return (
    <section style={{ ...baseStyle, ...style }}>
      {(title || actions) && (
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                style={{
                  border: '1px solid var(--panel-border)',
                  background: 'var(--button-bg)',
                  color: 'var(--text-color)',
                  borderRadius: 6,
                  width: 26,
                  height: 26,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  padding: 0,
                  fontWeight: 600,
                  transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease'
                }}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? '+' : '–'}
              </button>
            )}
            {title && <h3 style={titleStyle}>{title}</h3>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {!collapsed && <div style={computedContentStyle}>{children}</div>}
    </section>
  );
};

export default Panel;