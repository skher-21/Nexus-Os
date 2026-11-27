import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Minus, X, Square, Copy } from 'lucide-react';
import type { WindowState } from '@/system/types';
import { windowManager } from '@/system/WindowManager';
import { APP_REGISTRY } from '@/system/AppRegistry';
import { AppRenderer } from '@/apps/AppRenderer';

export function Window({ win }: { win: WindowState }) {
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; ow: number; oh: number; dir: string } | null>(null);
  const app = APP_REGISTRY[win.appId];
  const accent = app.accent;

  const onTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (win.maximized) return;
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      windowManager.focus(win.id);
      dragRef.current = { startX: e.clientX, startY: e.clientY, ox: win.x, oy: win.y };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const wa = windowManager.workArea();
        const nx = Math.max(wa.x, Math.min(dragRef.current.ox + (ev.clientX - dragRef.current.startX), wa.x + wa.width - 80));
        const ny = Math.max(wa.y, Math.min(dragRef.current.oy + (ev.clientY - dragRef.current.startY), wa.y + wa.height - 40));
        windowManager.updateRect(win.id, { x: nx, y: ny });
      };
      const onUp = (ev: MouseEvent) => {
        // snap to top -> maximize
        if (dragRef.current && ev.clientY <= 42) {
          windowManager.toggleMaximize(win.id);
        }
        dragRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [win.id, win.x, win.y, win.maximized]
  );

  const startResize = (dir: string) => (e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    windowManager.focus(win.id);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, ow: win.width, oh: win.height, dir };

    const min = app.minSize ?? { width: 320, height: 240 };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      let { x, y, width, height } = win;
      const r = resizeRef.current;
      if (r.dir.includes('e')) width = Math.max(min.width, r.ow + dx);
      if (r.dir.includes('s')) height = Math.max(min.height, r.oh + dy);
      if (r.dir.includes('w')) {
        width = Math.max(min.width, r.ow - dx);
        x = win.x + (r.ow - width);
      }
      if (r.dir.includes('n')) {
        height = Math.max(min.height, r.oh - dy);
        y = win.y + (r.oh - height);
      }
      windowManager.updateRect(win.id, { x, y, width, height });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (win.minimized) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      onMouseDown={() => windowManager.focus(win.id)}
      className="absolute flex flex-col overflow-hidden rounded-xl nexus-glass"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.z,
        borderColor: win.z === Math.max(...(windowManager.getWindows().filter((w) => !w.minimized).map((w) => w.z) || [0]))
          ? hexA(accent, 0.35)
          : 'var(--nexus-border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={onTitleMouseDown}
        onDoubleClick={() => windowManager.toggleMaximize(win.id)}
        className="flex h-9 shrink-0 items-center justify-between px-3"
        style={{ background: 'rgba(7,11,24,0.5)', borderBottom: '1px solid var(--nexus-border)', cursor: win.maximized ? 'default' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <win.icon size={14} style={{ color: accent }} />
          <span className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => windowManager.toggleMinimize(win.id)}
            className="rounded p-1 transition-colors hover:bg-white/10"
            title="Minimize"
          >
            <Minus size={13} style={{ color: 'var(--nexus-text-dim)' }} />
          </button>
          <button
            onClick={() => windowManager.toggleMaximize(win.id)}
            className="rounded p-1 transition-colors hover:bg-white/10"
            title="Maximize"
          >
            {win.maximized ? <Copy size={11} style={{ color: 'var(--nexus-text-dim)' }} /> : <Square size={11} style={{ color: 'var(--nexus-text-dim)' }} />}
          </button>
          <button
            onClick={() => windowManager.close(win.id)}
            className="rounded p-1 transition-colors hover:bg-red-500/20"
            title="Close"
          >
            <X size={13} style={{ color: 'var(--nexus-text-dim)' }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden" style={{ background: 'var(--nexus-bg)' }}>
        <AppRenderer win={win} />
      </div>

      {/* Resize handles */}
      {!win.maximized && (
        <>
          <div onMouseDown={startResize('n')} className="absolute left-2 right-2 top-0 h-1 cursor-ns-resize" />
          <div onMouseDown={startResize('s')} className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize" />
          <div onMouseDown={startResize('w')} className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize" />
          <div onMouseDown={startResize('e')} className="absolute right-0 top-2 bottom-2 w-1 cursor-ew-resize" />
          <div onMouseDown={startResize('nw')} className="absolute left-0 top-0 h-2.5 w-2.5 cursor-nwse-resize" />
          <div onMouseDown={startResize('ne')} className="absolute right-0 top-0 h-2.5 w-2.5 cursor-nesw-resize" />
          <div onMouseDown={startResize('sw')} className="absolute left-0 bottom-0 h-2.5 w-2.5 cursor-nesw-resize" />
          <div onMouseDown={startResize('se')} className="absolute right-0 bottom-0 h-2.5 w-2.5 cursor-nwse-resize" />
        </>
      )}
    </motion.div>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
