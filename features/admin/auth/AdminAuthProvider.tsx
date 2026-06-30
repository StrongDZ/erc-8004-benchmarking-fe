'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface AdminAuthValue {
    /** The active X-API-Key, or '' when locked. */
    apiKey: string;
    unlocked: boolean;
    /** Transient message shown on the lock screen (e.g. after a rejected key). */
    authError: string;
    unlock: (key: string) => void;
    lock: (reason?: string) => void;
}

// sessionStorage (not localStorage) so the operator key is dropped when the tab
// closes — a wrong tab left open does not leave a standing admin session.
const STORAGE_KEY = 'erc8004.admin.apiKey';

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [apiKey, setApiKey] = useState('');
    const [authError, setAuthError] = useState('');

    // Rehydrate after mount (sessionStorage is client-only; keeps SSR markup stable).
    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) setApiKey(stored);
    }, []);

    const unlock = useCallback((key: string) => {
        const k = key.trim();
        if (!k) return;
        sessionStorage.setItem(STORAGE_KEY, k);
        setApiKey(k);
        setAuthError('');
    }, []);

    const lock = useCallback((reason?: string) => {
        sessionStorage.removeItem(STORAGE_KEY);
        setApiKey('');
        setAuthError(reason ?? '');
    }, []);

    return (
        <AdminAuthContext.Provider value={{ apiKey, unlocked: apiKey.length > 0, authError, unlock, lock }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth(): AdminAuthValue {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
    return ctx;
}
