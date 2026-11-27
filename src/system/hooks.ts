import { useEffect, useState } from 'react';
import type { WindowState, Preferences, Notification } from './types';
import { windowManager } from './WindowManager';
import { notificationManager } from './NotificationManager';
import { PreferencesManager, DEFAULT_PREFS } from './Preferences';

export function useWindows(): WindowState[] {
  const [wins, setWins] = useState<WindowState[]>([]);
  useEffect(() => windowManager.subscribe(setWins), []);
  return wins;
}

export function useNotifications(): Notification[] {
  const [items, setItems] = useState<Notification[]>([]);
  useEffect(() => notificationManager.subscribe(setItems), []);
  return items;
}

export function usePreferences(): [Preferences, (patch: Partial<Preferences>) => void] {
  const [prefs, setPrefs] = useState<Preferences>(() => PreferencesManager.load());

  useEffect(() => {
    PreferencesManager.save(prefs);
    PreferencesManager.applyTheme(prefs.theme);
    PreferencesManager.applyAccent(prefs.accent);
  }, [prefs]);

  const update = (patch: Partial<Preferences>) =>
    setPrefs((p) => ({ ...p, ...patch }));

  return [prefs, update];
}

export function useClock(prefs: Preferences): { time: string; date: string } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: prefs.showSeconds ? '2-digit' : undefined,
    hour12: !prefs.clock24h,
  });
  const date = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return { time, date };
}

export { DEFAULT_PREFS };
