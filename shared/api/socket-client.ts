// shared/api/socket-client.ts
// Thin WebSocket client with auto-reconnect (exponential backoff) and listener registry.
// Designed to be owned by a single React provider (SocketProvider); do not instantiate
// multiple clients for the same URL in the same tab.

import { env } from '@/shared/config/env';
import {
    DEFAULT_API_BASE_URL,
    DEFAULT_WS_URL,
    SOCKET_PING_INTERVAL_MS,
    SOCKET_RECONNECT_INITIAL_DELAY_MS,
    SOCKET_RECONNECT_MAX_DELAY_MS,
} from '@/shared/constants/app';

export interface SocketClientOptions {
    url: string;
    // initial reconnect delay in ms; doubles up to maxReconnectDelayMs on consecutive failures.
    initialReconnectDelayMs?: number;
    maxReconnectDelayMs?: number;
    // heartbeat ping interval (server-side pong expected). 0 disables.
    pingIntervalMs?: number;
    // called on transport state changes — primarily for UI indicators.
    onStateChange?: (state: SocketState) => void;
}

export type SocketState = 'connecting' | 'open' | 'closed' | 'reconnecting';

// Listener receives the full parsed JSON payload. Callers typically narrow by `type`.
export type SocketListener = (payload: any) => void;

export class SocketClient {
    private readonly url: string;
    private readonly initialDelay: number;
    private readonly maxDelay: number;
    private readonly pingIntervalMs: number;
    private readonly onStateChange?: (state: SocketState) => void;

    private ws: WebSocket | null = null;
    private state: SocketState = 'closed';
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private manuallyClosed = false;
    private listeners = new Set<SocketListener>();

    constructor(opts: SocketClientOptions) {
        this.url = opts.url;
        this.initialDelay = opts.initialReconnectDelayMs ?? SOCKET_RECONNECT_INITIAL_DELAY_MS;
        this.maxDelay = opts.maxReconnectDelayMs ?? SOCKET_RECONNECT_MAX_DELAY_MS;
        this.pingIntervalMs = opts.pingIntervalMs ?? SOCKET_PING_INTERVAL_MS;
        this.onStateChange = opts.onStateChange;
    }

    connect(): void {
        if (typeof window === 'undefined') return; // SSR guard
        if (this.ws && (this.state === 'open' || this.state === 'connecting')) return;
        this.manuallyClosed = false;
        this.openSocket();
    }

    close(): void {
        this.manuallyClosed = true;
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
        if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
        if (this.ws) {
            try { this.ws.close(1000, 'client-close'); } catch { /* noop */ }
            this.ws = null;
        }
        this.setState('closed');
    }

    subscribe(listener: SocketListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    getState(): SocketState { return this.state; }

    private openSocket(): void {
        this.setState(this.reconnectAttempts === 0 ? 'connecting' : 'reconnecting');
        try {
            this.ws = new WebSocket(this.url);
        } catch (err) {
            // Invalid URL or browser blocked the connection; schedule retry.
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.setState('open');
            this.startPing();
        };

        this.ws.onmessage = (ev: MessageEvent) => {
            let payload: any;
            try { payload = JSON.parse(typeof ev.data === 'string' ? ev.data : ''); }
            catch { return; }
            // Guard against any future server-sent {"type":"pong"} frames.
            if (payload?.type === 'pong') return;
            this.listeners.forEach((l) => {
                try { l(payload); } catch { /* listener error — isolate */ }
            });
        };

        this.ws.onerror = () => {
            // Error typically precedes close; actual retry logic lives in onclose.
        };

        this.ws.onclose = () => {
            this.stopPing();
            this.ws = null;
            if (this.manuallyClosed) {
                this.setState('closed');
                return;
            }
            this.scheduleReconnect();
        };
    }

    private scheduleReconnect(): void {
        this.setState('reconnecting');
        const delay = Math.min(this.initialDelay * 2 ** this.reconnectAttempts, this.maxDelay);
        this.reconnectAttempts += 1;
        this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
    }

    private startPing(): void {
        if (this.pingIntervalMs <= 0) return;
        this.stopPing();
        this.pingTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                try { this.ws.send(JSON.stringify({ type: 'ping' })); } catch { /* noop */ }
            }
        }, this.pingIntervalMs);
    }

    private stopPing(): void {
        if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    }

    private setState(next: SocketState): void {
        if (this.state === next) return;
        this.state = next;
        this.onStateChange?.(next);
    }
}

// buildDefaultWsUrl converts the configured HTTP API base into a WebSocket URL.
// Falls back to window.location when env var is missing (common in self-hosted setups).
export function buildDefaultWsUrl(): string {
    const fromEnv = env.wsUrlOverride;
    if (fromEnv && fromEnv.length > 0) return fromEnv;

    const apiBase = env.apiBaseUrl || DEFAULT_API_BASE_URL;
    try {
        const base = typeof window !== 'undefined' ? window.location.origin : undefined;
        const u = new URL(apiBase, base);
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        // API base already ends with /api/v1 — append /ws.
        u.pathname = u.pathname.replace(/\/$/, '') + '/ws';
        return u.toString();
    } catch {
        return DEFAULT_WS_URL;
    }
}
