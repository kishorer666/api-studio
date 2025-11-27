import React, { useState } from 'react';

// Inject a global focus-visible style once for accessible keyboard focus
let focusStyleInjected = false;
function ensureFocusStyles() {
  if (typeof document === 'undefined' || focusStyleInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    button[data-focusable]:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      box-shadow: 0 0 0 4px rgba(10,132,255,0.25);
    }
    button[data-focusable]:focus { outline: none; }
    button[data-focusable] { position: relative; }
  `;
  document.head.appendChild(style);
  focusStyleInjected = true;
}

type Variant = 'primary' | 'danger' | 'subtle';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: React.ReactNode; // optional icon node
  iconPosition?: 'left' | 'right';
}

// Centralized classy, modest styling with gentle hover & active feedback.
const baseStyle: React.CSSProperties = {
  borderRadius: 8,
  fontWeight: 600,
  fontFamily: 'inherit',
  lineHeight: 1.2,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  userSelect: 'none',
  border: '1px solid transparent',
  transition: 'background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease'
};

function variantStyle(variant: Variant, disabled: boolean): React.CSSProperties {
  if (variant === 'danger') {
    return {
      background: disabled ? 'rgba(255,59,48,0.35)' : '#ff3b30',
      color: '#fff',
      borderColor: disabled ? 'rgba(214,40,32,0.4)' : '#d62820',
      boxShadow: disabled ? 'none' : '0 2px 6px rgba(255,59,48,0.3)'
    };
  }
  if (variant === 'subtle') {
    return {
      background: 'var(--panel-bg)',
      color: 'var(--text-color)',
      borderColor: 'var(--panel-border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
    };
  }
  // primary
  return {
    background: disabled ? 'rgba(10,132,255,0.45)' : 'var(--button-bg)',
    color: 'var(--button-text)',
    borderColor: 'var(--button-border)',
    boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.18)'
  };
}

function sizeStyle(size: Size): React.CSSProperties {
  switch (size) {
    case 'sm':
      return { fontSize: 13, padding: '6px 12px' };
    case 'md':
    default:
      return { fontSize: 15, padding: '8px 18px' };
  }
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  style,
  disabled,
  children,
  icon,
  iconPosition = 'left',
  ...rest
}) => {
  ensureFocusStyles();
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const vs = variantStyle(variant, !!disabled);
  const ss = sizeStyle(size);
  const hoverStyle: React.CSSProperties = hover && !disabled ? {
    filter: 'brightness(1.06)',
    boxShadow: vs.boxShadow ? vs.boxShadow + ', 0 0 0 3px rgba(10,132,255,0.15)' : undefined
  } : {};
  const activeStyle: React.CSSProperties = active && !disabled ? { transform: 'translateY(1px)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' } : {};
  const final: React.CSSProperties = {
    ...baseStyle,
    ...vs,
    ...ss,
    ...(block ? { width: '100%' } : {}),
    ...(disabled ? { cursor: 'not-allowed', opacity: 0.55 } : {}),
    ...hoverStyle,
    ...activeStyle,
    ...style
  };
  const content = (
    <>
      {icon && iconPosition === 'left' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
    </>
  );
  return (
    <button
      {...rest}
      data-focusable
      disabled={disabled}
      style={final}
      onMouseEnter={(e) => { setHover(true); rest.onMouseEnter && rest.onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); setActive(false); rest.onMouseLeave && rest.onMouseLeave(e); }}
      onMouseDown={(e) => { setActive(true); rest.onMouseDown && rest.onMouseDown(e); }}
      onMouseUp={(e) => { setActive(false); rest.onMouseUp && rest.onMouseUp(e); }}
    >
      {content}
    </button>
  );
};

export default Button;