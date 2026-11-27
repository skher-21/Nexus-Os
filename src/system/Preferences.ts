import type { Preferences, ThemeMode } from './types';

const KEY = 'nexus-preferences';

export const DEFAULT_PREFS: Preferences = {
  theme: 'dark',
  wallpaper: 'aurora',
  accent: '#22d3ee',
  animations: true,
  notifications: true,
  clock24h: true,
  showSeconds: true,
  showDesktopIcons: true,
  dockAutoHide: false,
  dockSize: 56,
  reducedMotion: false,
};

export const PreferencesManager = {
  load(): Preferences {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_PREFS };
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  },

  save(prefs: Preferences): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  },

  applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('nexus-theme-light');
    else root.classList.remove('nexus-theme-light');
  },

  applyAccent(accent: string): void {
    document.documentElement.style.setProperty('--nexus-accent', accent);
  },
};

export const WALLPAPERS: { id: string; name: string }[] = [
  { id: 'aurora', name: 'Aurora' },
  { id: 'nebula', name: 'Nebula' },
  { id: 'grid', name: 'Grid' },
  { id: 'deep', name: 'Deep Space' },
  { id: 'dawn', name: 'Dawn' },
];

export const ACCENTS: { id: string; name: string; color: string }[] = [
  { id: 'cyan', name: 'Cyan', color: '#22d3ee' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'emerald', name: 'Emerald', color: '#34d399' },
  { id: 'amber', name: 'Amber', color: '#fbbf24' },
  { id: 'rose', name: 'Rose', color: '#fb7185' },
];
