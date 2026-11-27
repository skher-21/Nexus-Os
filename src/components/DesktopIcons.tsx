import type { Preferences, AppId } from '@/system/types';
import { windowManager } from '@/system/WindowManager';
import { APP_LIST } from '@/system/AppRegistry';

const DESKTOP_APPS: AppId[] = ['files', 'lab', 'terminal', 'ai', 'studio', 'monitor', 'web', 'control'];

export function DesktopIcons({ prefs }: { prefs: Preferences }) {
  if (!prefs.showDesktopIcons) return null;
  return (
    <div className="fixed top-12 left-3 z-10 flex flex-col gap-1">
      {DESKTOP_APPS.map((id) => {
        const app = APP_LIST.find((a) => a.id === id)!;
        const Icon = app.icon;
        return (
          <button
            key={id}
            onDoubleClick={() => windowManager.open(id)}
            onClick={(e) => { e.stopPropagation(); }}
            className="group flex w-20 flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-white/5"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{ background: hexA(app.accent, 0.12), borderColor: hexA(app.accent, 0.3), color: app.accent }}
            >
              <Icon size={22} />
            </div>
            <span className="text-center text-[10px] leading-tight" style={{ color: 'var(--nexus-text-dim)' }}>
              {app.name.replace('NEXUS ', '')}
            </span>
          </button>
        );
      })}
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
