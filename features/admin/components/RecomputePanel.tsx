'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { api } from '@/shared/api/client';
import { useAdminAuth } from '@/features/admin/auth/AdminAuthProvider';
import type { LogEntry } from '@/features/admin/components/ActivityLog';

// Heuristic: apiFetch does not surface HTTP status, so detect auth failure from
// the server's error string to re-lock the console.
const AUTH_HINT = /unauthor|forbidden|api[\s-]?key|401|403/i;

export function RecomputePanel({ onLog }: { onLog: (e: LogEntry) => void }) {
    const { apiKey, lock } = useAdminAuth();
    const [chainId, setChainId] = useState('');
    const [loading, setLoading] = useState(false);

    async function trigger() {
        setLoading(true);
        try {
            const cid = chainId.trim() ? parseInt(chainId.trim(), 10) : 0;
            const res = await api.triggerRecompute(cid, apiKey || undefined);
            if (res.success && res.data) {
                onLog({ kind: 'recompute', ts: Date.now(), chainId: cid, result: res.data });
            } else {
                const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error) || 'unknown error';
                onLog({ kind: 'error', ts: Date.now(), action: 'recompute', message: msg });
                if (AUTH_HINT.test(msg)) lock('Key rejected by server. Re-enter a valid operator key.');
            }
        } catch (e) {
            onLog({ kind: 'error', ts: Date.now(), action: 'recompute', message: String(e) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card px-6 py-5 space-y-5">
            <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                    <RefreshCw size={16} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold font-heading text-white">Trigger Score Recomputation</h2>
                    <p className="text-xs text-muted mt-0.5">On-demand replay → score-refresh worker. Runs async (seconds–minutes).</p>
                </div>
            </div>

            <label className="block">
                <span className="text-xs text-subtle uppercase tracking-widest mb-1.5 block">Chain ID (0 = all chains)</span>
                <input
                    type="number"
                    min={0}
                    value={chainId}
                    onChange={(e) => setChainId(e.target.value)}
                    placeholder="0"
                    className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-primary/60 transition-colors"
                />
            </label>

            <button
                onClick={trigger}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 btn btn-primary btn-default"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {loading ? 'Queuing…' : 'Trigger Recompute'}
            </button>

            <div className="text-xs text-subtle bg-black/20 rounded-lg px-3 py-2.5 leading-relaxed border border-border/40">
                Replays <code className="text-primary/80">feedback_history</code> → re-runs{' '}
                <span className="text-white">Classify &amp; Score Feedback</span> and{' '}
                <span className="text-white">Recompute WalletTrust</span>, then rebuilds composite scores.
            </div>
        </div>
    );
}
