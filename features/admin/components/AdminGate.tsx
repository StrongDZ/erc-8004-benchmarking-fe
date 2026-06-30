'use client';

import { useState, type FormEvent } from 'react';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { env } from '@/shared/config/env';
import { useAdminAuth } from '@/features/admin/auth/AdminAuthProvider';

// Lock screen — the console is invisible until a key is supplied. The key is
// pre-filled from NEXT_PUBLIC_ADMIN_API_KEY when present so local operators can
// unlock in one click.
export function AdminGate() {
    const { unlock, authError } = useAdminAuth();
    const [key, setKey] = useState(env.adminApiKey ?? '');

    function submit(e: FormEvent) {
        e.preventDefault();
        unlock(key);
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6">
            <form
                onSubmit={submit}
                className="w-full max-w-md card p-8 flex flex-col items-center text-center"
            >
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 mb-5">
                    <ShieldAlert size={24} className="text-primary" />
                </div>
                <h1 className="font-heading text-xl font-bold text-white">Restricted Area</h1>
                <p className="text-xs text-muted mt-1.5 max-w-xs">
                    Operator-only controls. Enter your <span className="text-primary/80 font-mono">X-API-Key</span> to
                    unlock the console for this session.
                </p>

                <label className="block w-full mt-6 text-left">
                    <span className="text-3xs uppercase tracking-widest text-subtle mb-1.5 block">API Key</span>
                    <div className="flex items-center gap-2 bg-black/30 border border-border rounded-lg px-3 focus-within:border-primary/60 transition-colors">
                        <KeyRound size={15} className="text-muted shrink-0" />
                        <input
                            type="password"
                            autoFocus
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Paste operator key"
                            className="flex-1 bg-transparent border-none py-2.5 text-sm text-white outline-none placeholder:text-subtle"
                        />
                    </div>
                </label>

                {authError && (
                    <p className="w-full text-left text-2xs text-danger mt-2">{authError}</p>
                )}

                <button
                    type="submit"
                    disabled={!key.trim()}
                    className="w-full mt-5 flex items-center justify-center gap-2 btn btn-primary btn-default disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Unlock Console <ArrowRight size={14} />
                </button>

                <p className="text-3xs text-subtle mt-4">
                    Key is held in this tab only and cleared when it closes.
                </p>
            </form>
        </div>
    );
}
