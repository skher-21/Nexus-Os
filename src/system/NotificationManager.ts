import type { Notification, AppId } from './types';
import { eventBus } from './EventBus';

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `n-${Date.now()}-${Math.random().toString(36).slice(2)}`);

class NotificationManager {
  private listeners: Set<(n: Notification[]) => void> = new Set();
  private items: Notification[] = [];

  subscribe(fn: (n: Notification[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.items);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((l) => l([...this.items]));
  }

  add(input: {
    app: AppId;
    title: string;
    body: string;
    icon?: Notification['icon'];
  }): Notification {
    const n: Notification = {
      id: uid(),
      app: input.app,
      title: input.title,
      body: input.body,
      icon: input.icon,
      createdAt: Date.now(),
      read: false,
    };
    this.items = [n, ...this.items].slice(0, 50);
    eventBus.emit('notification:added', n);
    this.emit();
    return n;
  }

  markRead(id: string) {
    this.items = this.items.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.emit();
  }

  markAllRead() {
    this.items = this.items.map((n) => ({ ...n, read: true }));
    this.emit();
  }

  clear() {
    this.items = [];
    this.emit();
  }

  getAll(): Notification[] {
    return [...this.items];
  }

  unreadCount(): number {
    return this.items.filter((n) => !n.read).length;
  }
}

export const notificationManager = new NotificationManager();
