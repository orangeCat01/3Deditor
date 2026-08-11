export type EventHandler<TPayload = unknown> = (payload: TPayload) => void;

export class EventBus<TEvents extends object> {
  private handlers = new Map<keyof TEvents, Set<EventHandler>>();

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const handlers = this.handlers.get(event) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.handlers.set(event, handlers);
    return () => this.off(event, handler);
  }

  off<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}
