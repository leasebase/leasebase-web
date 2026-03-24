/**
 * Real-time notification WebSocket client.
 *
 * Singleton connection that:
 * - Connects to the notification-service WS endpoint
 * - Authenticates via JWT (first message)
 * - Reconnects with exponential backoff on disconnect
 * - Dispatches events to registered listeners
 *
 * Usage:
 *   import { notificationWs } from '@/lib/notifications/ws';
 *   notificationWs.connect(accessToken);
 *   notificationWs.on('notification.created', (data) => { ... });
 *   notificationWs.on('notification.unread_count_updated', (data) => { ... });
 */

type Listener = (data: any) => void;

const MAX_RECONNECT_DELAY = 30_000;
const INITIAL_RECONNECT_DELAY = 1_000;
const HEARTBEAT_INTERVAL = 30_000;

class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;
  private _connected = false;
  private _wsDisabledLogged = false;

  /** Whether the WebSocket is currently connected and authenticated. */
  get connected(): boolean {
    return this._connected;
  }

  /**
   * Connect to the notification-service WebSocket.
   * Safe to call multiple times — reconnects with the new token.
   *
   * Respects the NEXT_PUBLIC_ENABLE_WEBSOCKET env var.  When the flag is
   * absent or not "true", connection is skipped entirely and the caller
   * falls back to HTTP polling.  This prevents noisy CSP / connection
   * errors in environments where the WebSocket infra path is not yet wired.
   */
  connect(accessToken: string): void {
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'true') {
      if (!this._wsDisabledLogged) {
        console.info('[notifications] WebSocket disabled — using HTTP polling fallback');
        this._wsDisabledLogged = true;
      }
      return;
    }
    this.token = accessToken;
    this.intentionalClose = false;
    this.doConnect();
  }

  /** Gracefully disconnect. Will NOT auto-reconnect. */
  disconnect(): void {
    this.intentionalClose = true;
    this.cleanup();
  }

  /** Register an event listener. Returns an unsubscribe function. */
  on(event: string, listener: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set!.delete(listener);
  }

  /** Remove all listeners for an event, or all listeners if no event specified. */
  off(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private getWsUrl(): string {
    // Use dedicated WS URL if set, otherwise derive from API base URL
    const explicit = process.env.NEXT_PUBLIC_WS_URL;
    if (explicit) return explicit;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (!apiBase) return 'ws://localhost:3007/ws';

    // Convert http(s)://host → ws(s)://host/ws
    // In production the notification-service is behind the same ALB
    return apiBase.replace(/^http/, 'ws') + '/ws';
  }

  private doConnect(): void {
    if (!this.token) return;
    this.cleanup();

    try {
      const url = this.getWsUrl();
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      // Send auth message
      this.ws?.send(JSON.stringify({ type: 'auth', token: this.token }));
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === 'auth.success') {
          this._connected = true;
          this.startHeartbeat();
          this.emit('connected', msg);
          return;
        }

        if (msg.type === 'pong') return; // heartbeat response

        // Dispatch to listeners
        this.emit(msg.type, msg);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.stopHeartbeat();
      this.emit('disconnected', null);
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror; reconnect handled there
    };
  }

  private emit(event: string, data: any): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try { listener(data); } catch { /* listener error — don't crash */ }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;
    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, this.reconnectDelay);
    // Exponential backoff with cap
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }

  private cleanup(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this._connected = false;
  }
}

/** Singleton instance. */
export const notificationWs = new NotificationWebSocket();
