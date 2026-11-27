import type { AppDefinition, AppId } from './types';
import {
  FolderTree,
  FlaskConical,
  TerminalSquare,
  Sparkles,
  Code2,
  Activity,
  Globe,
  Settings,
} from 'lucide-react';

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  files: {
    id: 'files',
    name: 'NEXUS Files',
    tagline: 'Virtual filesystem',
    icon: FolderTree,
    accent: '#22d3ee',
    defaultSize: { width: 820, height: 560 },
    minSize: { width: 480, height: 360 },
    singleInstance: true,
  },
  lab: {
    id: 'lab',
    name: 'NEXUS Lab',
    tagline: 'Scientific simulations',
    icon: FlaskConical,
    accent: '#8b5cf6',
    defaultSize: { width: 960, height: 640 },
    minSize: { width: 600, height: 440 },
  },
  terminal: {
    id: 'terminal',
    name: 'NEXUS Terminal',
    tagline: 'Command interface',
    icon: TerminalSquare,
    accent: '#34d399',
    defaultSize: { width: 720, height: 480 },
    minSize: { width: 420, height: 300 },
  },
  ai: {
    id: 'ai',
    name: 'NEXUS AI',
    tagline: 'Research assistant',
    icon: Sparkles,
    accent: '#3b82f6',
    defaultSize: { width: 760, height: 600 },
    minSize: { width: 440, height: 400 },
    singleInstance: true,
  },
  studio: {
    id: 'studio',
    name: 'NEXUS Studio',
    tagline: 'Developer workspace',
    icon: Code2,
    accent: '#fb7185',
    defaultSize: { width: 940, height: 620 },
    minSize: { width: 560, height: 400 },
  },
  monitor: {
    id: 'monitor',
    name: 'NEXUS Monitor',
    tagline: 'System metrics',
    icon: Activity,
    accent: '#fbbf24',
    defaultSize: { width: 860, height: 580 },
    minSize: { width: 520, height: 380 },
    singleInstance: true,
  },
  web: {
    id: 'web',
    name: 'NEXUS Web',
    tagline: 'Browser',
    icon: Globe,
    accent: '#22d3ee',
    defaultSize: { width: 920, height: 620 },
    minSize: { width: 520, height: 380 },
  },
  control: {
    id: 'control',
    name: 'NEXUS Control',
    tagline: 'System settings',
    icon: Settings,
    accent: '#8b5cf6',
    defaultSize: { width: 820, height: 600 },
    minSize: { width: 480, height: 420 },
    singleInstance: true,
  },
};

export const APP_LIST = Object.values(APP_REGISTRY);

export function getApp(id: AppId): AppDefinition {
  return APP_REGISTRY[id];
}
