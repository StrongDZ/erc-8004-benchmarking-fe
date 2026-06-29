'use client';
// shared/hooks/useWalletENS.ts
// Resolves a wallet address's ENS primary name + avatar via the bulk
// GET /wallets/ens endpoint. Lookups for addresses requested within the same
// tick are batched into a single request, and results are cached at module
// scope so the same address is never looked up twice across the app.

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/client';

export interface WalletENSInfo {
    ens: string;
    ensAvatar: string;
}

// undefined = not yet requested, null = resolved (no ENS name)
const cache = new Map<string, WalletENSInfo | null>();
const listeners = new Map<string, Set<() => void>>();
const pending = new Set<string>();
let flushScheduled = false;

function notify(address: string): void {
    listeners.get(address)?.forEach((cb) => cb());
}

function flush(): void {
    flushScheduled = false;
    const addresses = Array.from(pending);
    pending.clear();
    if (addresses.length === 0) return;

    api.walletsENS(addresses)
        .then((res) => {
            const byAddress = new Map(res.data?.map((row) => [row.address.toLowerCase(), row]));
            for (const addr of addresses) {
                const row = byAddress.get(addr);
                cache.set(addr, row ? { ens: row.ens, ensAvatar: row.ensAvatar ?? '' } : null);
                notify(addr);
            }
        })
        .catch(() => {
            // Best-effort enrichment: clear pending cache entries so a future
            // mount can retry, and notify listeners so they stop waiting.
            for (const addr of addresses) {
                cache.delete(addr);
                notify(addr);
            }
        });
}

function scheduleFlush(): void {
    if (flushScheduled) return;
    flushScheduled = true;
    queueMicrotask(flush);
}

/** Returns the resolved ENS name + avatar for `address`, or null while loading / if unresolved. */
export function useWalletENS(address: string | undefined | null): WalletENSInfo | null {
    const normalized = address ? address.trim().toLowerCase() : '';
    const [info, setInfo] = useState<WalletENSInfo | null>(() => cache.get(normalized) ?? null);

    useEffect(() => {
        if (!normalized) return;

        const cached = cache.get(normalized);
        if (cached !== undefined) {
            setInfo(cached);
            return;
        }

        const onUpdate = () => setInfo(cache.get(normalized) ?? null);
        let set = listeners.get(normalized);
        if (!set) {
            set = new Set();
            listeners.set(normalized, set);
        }
        set.add(onUpdate);

        pending.add(normalized);
        scheduleFlush();

        return () => {
            set!.delete(onUpdate);
            if (set!.size === 0) listeners.delete(normalized);
        };
    }, [normalized]);

    return info;
}
