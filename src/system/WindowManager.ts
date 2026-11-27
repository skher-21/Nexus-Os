import type { WindowState, AppId, AppAction } from './types';
import { APP_REGISTRY } from './AppRegistry';
import { eventBus } from './EventBus';

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `w-${Date.now()}-${Math.random().toString(36).slice(2)}`);

class WindowManager {
  private listeners: Set<(w: WindowState[]) => void> = new Set();
  private windows: WindowState[] = [];
  private zTop = 10;

  subscribe(fn: (w: WindowState[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.windows);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((l) => l([...this.windows]));
  }

  open(appId: AppId, props?: Record<string, unknown>): string {
    const app = APP_REGISTRY[appId];
    if (app.singleInstance) {
      const existing = this.windows.find((w) => w.appId === appId);
      if (existing) {
        this.focus(existing.id);
        if (existing.minimized) this.toggleMinimize(existing.id);
        return existing.id;
      }
    }
    const id = uid();
    const offset = this.windows.length * 28;
    const wa = this.workArea();
    const width = Math.min(app.defaultSize.width, wa.width - 40);
    const height = Math.min(app.defaultSize.height, wa.height - 80);
    const w: WindowState = {
      id,
      appId,
      title: app.name,
      icon: app.icon,
      x: Math.max(20, Math.min(wa.x + 40 + offset, wa.x + wa.width - width - 20)),
      y: Math.max(48, Math.min(wa.y + 40 + offset, wa.y + wa.height - height - 80)),
      width,
      height,
      z: ++this.zTop,
      minimized: false,
      maximized: false,
      props,
    };
    this.windows = [...this.windows, w];
    eventBus.emit('window:open', w);
    eventBus.emit('app:launch', { appId });
    this.emit();
    return id;
  }

  workArea() {
    return { x: 0, y: 40, width: window.innerWidth, height: window.innerHeight - 40 - 88 };
  }

  close(id: string) {
    this.windows = this.windows.filter((w) => w.id !== id);
    eventBus.emit('window:close', { id });
    this.emit();
  }

  focus(id: string) {
    this.windows = this.windows.map((w) =>
      w.id === id ? { ...w, z: ++this.zTop } : w
    );
    eventBus.emit('window:focus', { id });
    this.emit();
  }

  toggleMinimize(id: string) {
    this.windows = this.windows.map((w) =>
      w.id === id ? { ...w, minimized: !w.minimized } : w
    );
    eventBus.emit('window:minimize', { id });
    this.emit();
  }

  minimize(id: string) {
    this.windows = this.windows.map((w) =>
      w.id === id ? { ...w, minimized: true } : w
    );
    this.emit();
  }

  toggleMaximize(id: string) {
    this.windows = this.windows.map((w) => {
      if (w.id !== id) return w;
      if (w.maximized && w.prevRect) {
        return { ...w, maximized: false, ...w.prevRect, prevRect: undefined };
      }
      const wa = this.workArea();
      return {
        ...w,
        maximized: true,
        prevRect: { x: w.x, y: w.y, width: w.width, height: w.height },
        x: wa.x,
        y: wa.y,
        width: wa.width,
        height: wa.height,
      };
    });
    eventBus.emit('window:maximize', { id });
    this.emit();
  }

  updateRect(id: string, rect: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) {
    this.windows = this.windows.map((w) =>
      w.id === id ? { ...w, ...rect, maximized: false } : w
    );
    this.emit();
  }

  setTitle(id: string, title: string) {
    this.windows = this.windows.map((w) =>
      w.id === id ? { ...w, title } : w
    );
    this.emit();
  }

  getWindows(): WindowState[] {
    return [...this.windows];
  }

  getOpenAppIds(): AppId[] {
    return Array.from(new Set(this.windows.map((w) => w.appId)));
  }

  cycleNext() {
    const visible = this.windows.filter((w) => !w.minimized);
    if (visible.length < 2) return;
    visible.sort((a, b) => a.z - b.z);
    this.focus(visible[0].id);
  }

  sendAction(appId: AppId, action: AppAction) {
    eventBus.emit('app:action', { appId, action });
  }
}

export const windowManager = new WindowManager();
