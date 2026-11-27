import type { EventType } from './types';

type Handler = (payload?: unknown) => void;

class EventBus {
  private handlers: Map<EventType, Set<Handler>> = new Map();

  on(event: EventType, handler: Handler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: EventType, handler: Handler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: EventType, payload?: unknown): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error('[EventBus] handler error', e);
      }
    });
  }
}

export const eventBus = new EventBus();
