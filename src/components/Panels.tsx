import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Sun,
  Moon,
  Wifi,
  Volume2,
  BatteryFull,
  Bluetooth,
  Palette,
  Trash2,
  X,
} from 'lucide-react';
import type { Preferences } from '@/system/types';
import { useNotifications } from '@/system/hooks';
import { notificationManager } from '@/system/NotificationManager';
import { APP_REGISTRY } from '@/system/AppRegistry';
import { ACCENTS } from '@/system/Preferences';

export function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const notifications = useNotifications();

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[700]" onClick={onClose} />
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-2 top-12 z-[800] w-[360px] max-w-[94vw] overflow-hidden rounded-xl nexus-glass"
            style={{ maxHeight: '80vh', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--nexus-border)' }}>
              <div className="flex items-center gap-2">
                <Bell size={16} style={{ color: 'var(--nexus-accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--nexus-text)' }}>Notifications</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => notificationManager.markAllRead()}
                  className="rounded p-1 text-[10px] transition-colors hover:bg-white/5"
                  style={{ color: 'var(--nexus-text-faint)' }}
                >
                  Mark all read
                </button>
                <button
                  onClick={() => notificationManager.clear()}
                  className="rounded p-1 transition-colors hover:bg-white/5"
                >
                  <Trash2 size={13} style={{ color: 'var(--nexus-text-faint)' }} />
                </button>
                <button onClick={onClose} className="rounded p-1 transition-colors hover:bg-white/5">
                  <X size={14} style={{ color: 'var(--nexus-text-faint)' }} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Bell size={28} style={{ color: 'var(--nexus-text-faint)', opacity: 0.4 }} />
                  <p className="mt-3 text-xs" style={{ color: 'var(--nexus-text-faint)' }}>No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const app = APP_REGISTRY[n.app];
                  const Icon = n.icon ?? app?.icon;
                  return (
                    <div
                      key={n.id}
                      className="border-b px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.02]"
                      style={{ borderColor: 'var(--nexus-border)' }}
                      onClick={() => notificationManager.markRead(n.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        {Icon && (
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: hexA(app?.accent ?? '#22d3ee', 0.15), color: app?.accent ?? '#22d3ee' }}>
                            <Icon size={14} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium" style={{ color: 'var(--nexus-text)' }}>{n.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--nexus-text-dim)' }}>{n.body}</p>
                          <p className="mt-1 text-[9px]" style={{ color: 'var(--nexus-text-faint)' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--nexus-accent)' }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function QuickSettings({
  open,
  onClose,
  prefs,
  updatePrefs,
}: {
  open: boolean;
  onClose: () => void;
  prefs: Preferences;
  updatePrefs: (p: Partial<Preferences>) => void;
}) {
  const toggles = [
    { key: 'wifi', icon: Wifi, label: 'Wi-Fi', on: true, fixed: true },
    { key: 'bt', icon: Bluetooth, label: 'Bluetooth', on: false, fixed: true },
    { key: 'theme', icon: prefs.theme === 'dark' ? Moon : Sun, label: prefs.theme === 'dark' ? 'Dark' : 'Light', on: prefs.theme === 'dark', action: () => updatePrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' }) },
    { key: 'anim', icon: Palette, label: 'Animations', on: prefs.animations, action: () => updatePrefs({ animations: !prefs.animations }) },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-[700]" onClick={onClose} />
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-2 top-12 z-[800] w-[340px] max-w-[94vw] overflow-hidden rounded-xl nexus-glass"
            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
          >
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {toggles.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={t.action}
                      disabled={t.fixed}
                      className="flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all disabled:opacity-60"
                      style={{
                        borderColor: t.on ? hexA(prefs.accent, 0.4) : 'var(--nexus-border)',
                        background: t.on ? hexA(prefs.accent, 0.1) : 'transparent',
                      }}
                    >
                      <Icon size={16} style={{ color: t.on ? prefs.accent : 'var(--nexus-text-dim)' }} />
                      <span className="text-xs" style={{ color: 'var(--nexus-text)' }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>
                    <Volume2 size={11} /> Volume
                  </div>
                  <input type="range" defaultValue={70} className="w-full accent-cyan-400" />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>
                    <BatteryFull size={11} /> Brightness
                  </div>
                  <input type="range" defaultValue={85} className="w-full accent-cyan-400" />
                </div>
              </div>

              <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--nexus-border)' }}>
                <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--nexus-text-faint)' }}>Accent</p>
                <div className="flex gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => updatePrefs({ accent: a.color })}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: a.color, borderColor: prefs.accent === a.color ? '#fff' : 'transparent' }}
                      title={a.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
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
