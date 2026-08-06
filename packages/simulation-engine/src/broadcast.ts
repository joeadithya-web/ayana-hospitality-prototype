import type { SimulationEvent, SimulationEventType } from '@ayana/shared-types';

const CHANNEL_NAME = 'ayana-simulation';

type Listener = (event: SimulationEvent) => void;

/**
 * Cross-tab sync for the single-origin app shell (Traveller/Dashboard/Kiosk/Control
 * Centre all live under one origin as different routes). Prefers BroadcastChannel;
 * falls back to the `storage` event for browsers/contexts without it. No backend.
 */
class SimulationBus {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof window === 'undefined') return;

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e: MessageEvent<SimulationEvent>) => {
        this.listeners.forEach((listener) => listener(e.data));
      };
    } else {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key !== CHANNEL_NAME || !e.newValue) return;
        const event = JSON.parse(e.newValue) as SimulationEvent;
        this.listeners.forEach((listener) => listener(event));
      });
    }
  }

  publish<TPayload>(type: SimulationEventType, payload: TPayload): void {
    const event: SimulationEvent<TPayload> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    if (this.channel) {
      this.channel.postMessage(event);
    } else if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHANNEL_NAME, JSON.stringify(event));
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const simulationBus = new SimulationBus();
