import React, { useEffect, useRef, useState } from 'react';
import './KernelCursor.css';

type CursorMode = 'default' | 'hover-cta' | 'hover-viz' | 'hover-terminal' | 'clicking';

export const KernelCursor: React.FC = () => {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [mode, setMode] = useState<CursorMode>('default');
  const rafRef = useRef<number>(0);
  const [isTouch] = useState(() => typeof window !== 'undefined' && 'ontouchstart' in window);

  const modeRef = useRef<CursorMode>('default');

  useEffect(() => {
    if (isTouch) return;

    const onMouseMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };

      const el = e.target as HTMLElement;
      let nextMode: CursorMode = 'default';
      if (el.closest('.boot-console, .kernel-terminal, .input-field, input, textarea')) {
        nextMode = 'hover-terminal';
      } else if (el.closest('.btn, button, a, [role="button"], .boot-enter, .boot-skip')) {
        nextMode = 'hover-cta';
      } else if (el.closest('.viz-canvas, canvas, .scheduler-canvas, .gantt-row')) {
        nextMode = 'hover-viz';
      }

      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }
    };

    const onDown = () => {
      modeRef.current = 'clicking';
      setMode('clicking');
    };
    const onUp = () => {
      modeRef.current = 'default';
      setMode('default');
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    const animate = () => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot && ring) {
        dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
        ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.18;
        ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.18;
        ring.style.transform = `translate(${ringPos.current.x - 18}px, ${ringPos.current.y - 18}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      <div ref={dotRef} className={`kv-cursor-dot kv-cursor-dot--${mode}`} />
      <div ref={ringRef} className={`kv-cursor-ring kv-cursor-ring--${mode}`} />
    </>
  );
};
