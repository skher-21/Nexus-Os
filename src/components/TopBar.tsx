import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Wifi,
  Volume2,
  BatteryFull,
  Bell,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Power,
} from 'lucide-react';
import type { Preferences } from '@/system/types';
import { useClock, useNotifications } from '@/system/hooks';
import { windowManager } from '@/system/WindowManager';
import { notificationManager } from '@/system/NotificationManager';
import { APP_LIST } from '@/system/AppRegistry';
import type { AppId } from '@/system/types';

export function TopBar({
  prefs,
  updatePrefs,
  onLauncher,
  onNotifications,
  onQuickSettings,
  user,
  onLogout,
}: {
  prefs: Preferences;
  updatePrefs: (p: Partial<Preferences>) => void;
  onLauncher: () => void;
  onNotifications: () => void;
  onQuickSettings: () => void;
  user: string;
  onLogout: () => void;
}) {
  const { time, date } = useClock(prefs);
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[500] flex h-10 items-center justify-between px-3 nexus-glass"
      style={{ borderBottom: '1px solid var(--nexus-border)' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onLauncher}
          className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/5"
        >
          <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#0b1226" stroke="#22d3ee" strokeWidth="2" />
            <path d="M20 44V20l24 24V20" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold tracking-wider" style={{ color: 'var(--nexus-text)' }}>
            NEXUS
          </span>
        </button>
        <button
          onClick={onLauncher}
          className="hidden items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-white/5 sm:flex"
          style={{ color: 'var(--nexus-text-dim)' }}
        >
          <Search size={13} /> Search apps...
          <kbd className="ml-2 rounded border px-1 text-[10px]" style={{ borderColor: 'var(--nexus-border)' }}>⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* Quick toggles */}
        <button
          onClick={() => updatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' })}
          className="rounded-md p-1.5 transition-colors hover:bg-white/5"
          title="Toggle theme"
        >
          {prefs.theme === 'dark' ? <Moon size={15} style={{ color: 'var(--nexus-text-dim)' }} /> : <Sun size={15} style={{ color: 'var(--nexus-text-dim)' }} />}
        </button>
        <button onClick={onQuickSettings} className="hidden rounded-md p-1.5 transition-colors hover:bg-white/5 sm:block" title="Quick settings">
          <Wifi size={14} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <button onClick={onQuickSettings} className="hidden rounded-md p-1.5 transition-colors hover:bg-white/5 sm:block">
          <Volume2 size={14} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>
        <button onClick={onQuickSettings} className="hidden rounded-md p-1.5 transition-colors hover:bg-white/5 sm:block">
          <BatteryFull size={14} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>

        <button
          onClick={onNotifications}
          className="relative rounded-md p-1.5 transition-colors hover:bg-white/5"
          title="Notifications"
        >
          <Bell size={15} style={{ color: 'var(--nexus-text-dim)' }} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[9px] font-bold" style={{ background: 'var(--nexus-accent)', color: '#070b18' }}>
              {unread}
            </span>
          )}
        </button>

        <button
          onClick={() => windowManager.open('control')}
          className="rounded-md p-1.5 transition-colors hover:bg-white/5"
          title="Settings"
        >
          <Settings size={15} style={{ color: 'var(--nexus-text-dim)' }} />
        </button>

        <div className="mx-1 h-4 w-px" style={{ background: 'var(--nexus-border)' }} />

        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <div className="text-xs font-medium leading-tight" style={{ color: 'var(--nexus-text)' }}>{time}</div>
            <div className="text-[10px] leading-tight" style={{ color: 'var(--nexus-text-faint)' }}>{date}</div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: 'var(--nexus-accent)', color: '#070b18' }}>
                {user.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={12} style={{ color: 'var(--nexus-text-dim)' }} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-[600]" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 top-8 z-[700] w-52 overflow-hidden rounded-lg nexus-glass"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  >
                    <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--nexus-border)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{user}</p>
                      <p className="text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>NEXUS Researcher</p>
                    </div>
                    <button
                      onClick={() => { windowManager.open('control'); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                      style={{ color: 'var(--nexus-text-dim)' }}
                    >
                      <Settings size={13} /> System Settings
                    </button>
                    <div className="border-t" style={{ borderColor: 'var(--nexus-border)' }}>
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/5"
                        style={{ color: 'var(--nexus-error)' }}
                      >
                        <Power size={13} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLauncher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const filtered = APP_LIST.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase()) ||
    a.tagline.toLowerCase().includes(q.toLowerCase())
  );

  const launch = (id: AppId) => {
    windowManager.open(id);
    setQ('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[800] flex items-start justify-center pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(7,11,24,0.5)', backdropFilter: 'blur(4px)' }} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-[640px] max-w-[92vw] overflow-hidden rounded-2xl nexus-glass"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--nexus-border)' }}>
              <Search size={18} style={{ color: 'var(--nexus-accent)' }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered[0]) launch(filtered[0].id);
                  if (e.key === 'Escape') onClose();
                }}
                placeholder="Search NEXUS applications..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--nexus-text)' }}
              />
              <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'var(--nexus-border)', color: 'var(--nexus-text-faint)' }}>ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-3">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--nexus-text-faint)' }}>No applications found</p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filtered.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      onClick={() => launch(app.id)}
                      className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:scale-[1.02]"
                      style={{ borderColor: 'var(--nexus-border)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: hexA(app.accent, 0.15), color: app.accent }}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{app.name}</p>
                        <p className="truncate text-[10px]" style={{ color: 'var(--nexus-text-faint)' }}>{app.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
