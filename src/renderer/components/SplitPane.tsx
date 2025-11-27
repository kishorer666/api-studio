import React, { useRef, useState, useEffect } from 'react';

interface SplitPaneProps {
  direction: 'vertical' | 'horizontal'; // vertical = left/right, horizontal = top/bottom
  initialPrimarySize?: number; // pixels
  minPrimarySize?: number;
  minSecondarySize?: number;
  children: [React.ReactNode, React.ReactNode];
  /** Optional style overrides */
  style?: React.CSSProperties;
  /** Enable double-click maximize/restore behavior */
  enableToggle?: boolean;
}

// Lightweight split pane component for desktop layout
const SplitPane: React.FC<SplitPaneProps> = ({
  direction,
  initialPrimarySize = 360,
  minPrimarySize = 240,
  minSecondarySize = 240,
  children,
  style,
  enableToggle = true
}) => {
    const prevSizeRef = useRef<number | null>(null);
    const handleDividerDoubleClick = () => {
      if (!enableToggle || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (prevSizeRef.current == null) {
        // Maximize primary
        prevSizeRef.current = primarySize;
        const full = direction === 'vertical' ? rect.width : rect.height;
        // Leave minimum space for secondary
        const target = full - minSecondarySize - 12; // buffer
        setPrimarySize(Math.max(minPrimarySize, target));
      } else {
        // Restore
        setPrimarySize(prevSizeRef.current);
        prevSizeRef.current = null;
      }
    };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(initialPrimarySize);
  const [primarySize, setPrimarySize] = useState(initialPrimarySize);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const delta = direction === 'vertical' ? (e.clientX - startPosRef.current) : (e.clientY - startPosRef.current);
      let newSize = startSizeRef.current + delta;
      const rect = containerRef.current.getBoundingClientRect();
      const max = direction === 'vertical' ? (rect.width - minSecondarySize - 40) : (rect.height - minSecondarySize - 40); // buffer
      if (newSize < minPrimarySize) newSize = minPrimarySize;
      if (newSize > max) newSize = max;
      setPrimarySize(newSize);
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [direction, minPrimarySize, minSecondarySize]);

  const startDrag = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startPosRef.current = direction === 'vertical' ? e.clientX : e.clientY;
    startSizeRef.current = primarySize;
    e.preventDefault();
  };

  const dividerStyle: React.CSSProperties = direction === 'vertical'
    ? {
        width: 6,
        cursor: 'col-resize',
        background: 'linear-gradient(to bottom, #d0d4d8, #c2c6ca)',
        borderLeft: '1px solid #b9c0c7',
        borderRight: '1px solid #b9c0c7',
        margin: '0 4px',
        borderRadius: 3,
        flexShrink: 0
      }
    : {
        height: 6,
        cursor: 'row-resize',
        background: 'linear-gradient(to right, #d0d4d8, #c2c6ca)',
        borderTop: '1px solid #b9c0c7',
        borderBottom: '1px solid #b9c0c7',
        margin: '4px 0',
        borderRadius: 3,
        flexShrink: 0
      };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'row' : 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        ...(style || {})
      }}
    >
      <div style={direction === 'vertical' ? { width: primarySize, minWidth: minPrimarySize, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : { height: primarySize, minHeight: minPrimarySize, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children[0]}
      </div>
      <div
        onMouseDown={startDrag}
        onDoubleClick={handleDividerDoubleClick}
        style={dividerStyle}
        title="Drag to resize / Double-click to toggle"
      />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children[1]}
      </div>
    </div>
  );
};

export default SplitPane;