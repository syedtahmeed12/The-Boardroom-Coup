import {
  ServerEvent,
  ClientCommand,
} from '@boardroom/contracts';

type Listener = (event: ServerEvent) => void;

class GameSocket {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;
  private pendingSession: string | null = null;
  private url = '';

  connect(url: string, sessionToken?: string): void {
    this.url = url;
    this.pendingSession = sessionToken ?? null;
    this.shouldReconnect = true;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      if (this.pendingSession) {
        this.send({ type: 'rejoin', sessionToken: this.pendingSession });
      }
    };

    this.ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data as string) as ServerEvent;
        for (const fn of this.listeners) fn(event);
      } catch { /* ignore parse errors */ }
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.openConnection(), 2000);
      }
    };

    this.ws.onerror = () => { /* handled by onclose */ };
  }

  send(command: ClientCommand): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export const gameSocket = new GameSocket();

export function getWebSocketUrl(): string {
  const envUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_WS_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://localhost:3001/ws';
}
