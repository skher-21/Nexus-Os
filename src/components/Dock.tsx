import { motion } from 'framer-motion';
import type { WindowState, AppId, Preferences } from '@/system/types';
import { APP_LIST, APP_REGISTRY } from '@/system/AppRegistry';
import { windowManager } from '@/system/WindowManager';

export function Dock({
  windows,
  prefs,
}: {
  windows: WindowState[];
  prefs: Preferences;
}) {
  const openAppIds = new Set(windows.map((w) => w.appId));

  const handleClick = (appId: AppId) => {
    const appWins = windows.filter((w) => w.appId === appId);
    if (appWins.length === 0) {
      windowManager.open(appId);
    } else {
      const anyVisible = appWins.some((w) => !w.minimized);
      if (anyVisible && appWins.length === 1) {
        windowManager.minimize(appWins[0].id);
      } else {
        const top = appWins
          .filter((w) => w.minimized)
          .sort((a, b) => b.z - a.z)[0] ?? appWins.sort((a, b) => b.z - a.z)[0];
        if (top) {
          windowManager.focus(top.id);
          if (top.minimized) windowManager.toggleMinimize(top.id);
        }
      }
    }
  };

  const size = prefs.dockSize;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[500] flex justify-center pb-2">
      <motion.div
        layout
        className="flex items-end gap-1.5 rounded-2xl nexus-glass px-2 py-2"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
      >
        {APP_LIST.map((app) => {
          const Icon = app.icon;
          const wins = windows.filter((w) => w.appId === app.id);
          const isOpen = openAppIds.has(app.id);
          const hasFocus = wins.some((w) => !w.minimized && w.z === Math.max(...windows.filter((x) => !x.minimized).map((x) => x.z), 0));
          return (
            <div key={app.id} className="group relative flex flex-col items-center">
              {wins.length > 1 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded px-1 text-[9px] font-bold" style={{ background: app.accent, color: '#070b18' }}>
                  {wins.length}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(app.id)}
                onDoubleClick={() => windowManager.open(app.id)}
                className="flex items-center justify-center rounded-xl border transition-colors"
                style={{
                  width: size,
                  height: size,
                  background: isOpen ? hexA(app.accent, 0.14) : 'rgba(255,255,255,0.03)',
                  borderColor: hasFocus ? hexA(app.accent, 0.5) : 'transparent',
                  color: app.accent,
                }}
                title={app.name}
              >
                <Icon size={size * 0.5} />
              </motion.button>
              <div
                className="mt-0.5 h-1 w-1 rounded-full transition-opacity"
                style={{ background: app.accent, opacity: isOpen ? 1 : 0 }}
              />
              <div className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 nexus-glass" style={{ color: 'var(--nexus-text)' }}>
                {app.name}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
