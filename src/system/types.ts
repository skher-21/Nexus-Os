// Core type definitions for NEXUS OS

export type AppId =
  | 'files'
  | 'lab'
  | 'terminal'
  | 'ai'
  | 'studio'
  | 'monitor'
  | 'web'
  | 'control';

export interface AppDefinition {
  id: AppId;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties; fill?: string }>;
  accent: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  singleInstance?: boolean;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties; fill?: string }>;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prevRect?: { x: number; y: number; width: number; height: number };
  props?: Record<string, unknown>;
}

export interface NexusFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null; // null = root
  content?: string;
  mimeType?: string;
  createdAt: number;
  updatedAt: number;
  meta?: Record<string, unknown>;
}

export interface Experiment {
  id: string;
  lab: 'orbit' | 'wave' | 'fluid';
  name: string;
  description: string;
  data: Record<string, unknown>;
  createdAt: number;
}

export type ThemeMode = 'dark' | 'light';

export interface Preferences {
  theme: ThemeMode;
  wallpaper: string;
  accent: string;
  animations: boolean;
  notifications: boolean;
  clock24h: boolean;
  showSeconds: boolean;
  showDesktopIcons: boolean;
  dockAutoHide: boolean;
  dockSize: number;
  reducedMotion: boolean;
}

export interface Notification {
  id: string;
  app: AppId;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  icon?: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties; fill?: string }>;
}

export type EventType =
  | 'window:open'
  | 'window:close'
  | 'window:focus'
  | 'window:minimize'
  | 'window:maximize'
  | 'fs:changed'
  | 'experiment:saved'
  | 'preference:changed'
  | 'notification:added'
  | 'notification:read'
  | 'theme:changed'
  | 'app:launch'
  | 'app:action'
  | 'monitor:tick';

export interface AppAction {
  type: string;
  payload?: Record<string, unknown>;
}
