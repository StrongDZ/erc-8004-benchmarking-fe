'use client';

import Link from 'next/link';
import { Terminal, Lock, LogOut } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/auth/AdminAuthProvider';

// Operator console header — deliberately distinct from the public Navbar so it is
// obvious you have left the user-facing site and entered restricted controls.
export function AdminHeader() {
    const { unlocked, lock } = useAdminAuth();

    return (
        <header
            className="sticky top-0 z-50 border-b border-primary/25 bg-elevated/95 backdrop-blur-xl"
            style={{ boxShadow: '0 1px 0 0 rgba(245,158,11,0.35), 0 8px 24px -12px rgba(0,0,0,0.8)' }}
        >
            {/* warning stripe */}
            <div
                className="h-0.5 w-full"
                style={{ background: 'linear-gradient(90deg,#F59E0B,#FBBF24 40%,transparent)' }}
            />
            <div className="h-14 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/15 border border-primary/30 shrink-0">
                        <Terminal size={16} className="text-primary" />
                    </div>
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="font-heading text-sm font-bold text-white tracking-wide truncate">
                            ADMIN CONSOLE
                        </span>
                        <span className="text-3xs uppercase tracking-[0.25em] text-primary/80 mt-0.5">
                            System Operator
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider ${
                            unlocked
                                ? 'border-success/40 bg-success/10 text-success'
                                : 'border-danger/40 bg-danger/10 text-danger'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${unlocked ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                        {unlocked ? 'Secured session' : 'Locked'}
                    </span>

                    {unlocked && (
                        <button
                            type="button"
                            onClick={() => lock()}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/5 px-2.5 py-1.5 text-2xs font-medium text-muted hover:text-danger hover:border-danger/40 transition-colors"
                            title="Lock the console and clear the session key"
                        >
                            <Lock size={13} /> Lock
                        </button>
                    )}

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/5 px-2.5 py-1.5 text-2xs font-medium text-muted hover:text-white transition-colors"
                        title="Return to the public site"
                    >
                        <LogOut size={13} /> Exit to site
                    </Link>
                </div>
            </div>
        </header>
    );
}
