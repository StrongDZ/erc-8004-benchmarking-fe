'use client';
// providers/SocketProvider.tsx
// Owns the singleton SocketClient for the app and exposes it via React context.
// Wrap the root layout once; components use `useSocket()` or `useSocketEvent()`
// hooks rather than instantiating their own clients.

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SocketClient, SocketState, buildDefaultWsUrl } from '@/shared/api/socket-client';

interface SocketCtx {
    client: SocketClient | null;
    state: SocketState;
}

const SocketContext = createContext<SocketCtx>({ client: null, state: 'closed' });

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<SocketState>('closed');
    const clientRef = useRef<SocketClient | null>(null);

    // Build once per mount. URL is derived at first render (env vars are static at build time).
    const client = useMemo(() => {
        if (typeof window === 'undefined') return null; // SSR
        const c = new SocketClient({ url: buildDefaultWsUrl(), onStateChange: setState });
        clientRef.current = c;
        return c;
    }, []);

    useEffect(() => {
        if (!client) return;
        client.connect();
        return () => { client.close(); };
    }, [client]);

    return (
        <SocketContext.Provider value={{ client, state }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): SocketCtx { return useContext(SocketContext); }
