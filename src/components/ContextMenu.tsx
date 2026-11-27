import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MenuItem {
  label?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
  onClick?: () => void;
  separator?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

let openSetters: ((s: MenuState | null) => void) | null = null;

export function openMenu(state: MenuState) {
  openSetters?.(state);
}

export function closeMenu() {
  openSetters?.(null);
}

export function ContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openSetters = setMenu;
    return () => { openSetters = null; };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  // clamp position
  const pos = menu
    ? {
        x: Math.min(menu.x, window.innerWidth - 220),
        y: Math.min(menu.y, window.innerHeight - menu.items.length * 34 - 16),
      }
    : { x: 0, y: 0 };

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[9000] w-52 overflow-hidden rounded-lg nexus-glass"
          style={{ left: pos.x, top: pos.y, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.items.map((item, i) =>
            item.separator ? (
              <div key={i} className="my-1 h-px" style={{ background: 'var(--nexus-border)' }} />
            ) : (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5 disabled:opacity-40"
                style={{ color: item.danger ? 'var(--nexus-error)' : 'var(--nexus-text-dim)' }}
              >
                {item.icon && <item.icon size={13} />}
                <span>{item.label}</span>
              </button>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
