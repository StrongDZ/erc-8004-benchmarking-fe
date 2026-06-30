'use client';

import { useState } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { api } from '@/shared/api/client';
import { SANDBOX_CHAIN_ID } from '@/shared/constants/app';
import { useAdminAuth } from '@/features/admin/auth/AdminAuthProvider';
import type { LogEntry } from '@/features/admin/components/ActivityLog';

const AUTH_HINT = /unauthor|forbidden|api[\s-]?key|401|403/i;

export function SimulatorPanel({ onLog }: { onLog: (e: LogEntry) => void }) {
    const { apiKey, lock } = useAdminAuth();
    const [agentId, setAgentId] = useState('');
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);

    async function start() {
        setLoading(true);
        try {
            const res = await api.startSimulator(agentId.trim() || undefined, count, apiKey || undefined);
            if (res.success && res.data) {
                onLog({ kind: 'simulator', ts: Date.now(), agentId: res.data.agentId, count: res.data.count, result: res.data });
            } else {
                const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error) || 'unknown error';
                onLog({ kind: 'error', ts: Date.now(), action: 'simulator', message: msg });
                if (AUTH_HINT.test(msg)) lock('Key rejected by server. Re-enter a valid operator key.');
            }
        } catch (e) {
            onLog({ kind: 'error', ts: Date.now(), action: 'simulator', message: String(e) });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="card px-6 py-5 space-y-5">
            <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                    <FlaskConical size={16} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold font-heading text-white">Start Feedback Simulator</h2>
                    <p className="text-xs text-muted mt-0.5">
                        Injects synthetic feedback on sandbox chain ({SANDBOX_CHAIN_ID}) — never touches live data.
                    </p>
                </div>
            </div>

            <label className="block">
                <span className="text-xs text-subtle uppercase tracking-widest mb-1.5 block">Agent ID (leave empty to auto-generate)</span>
                <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="sim-agent-0"
                    className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-primary/60 transition-colors"
                />
            </label>

            <label className="block">
                <span className="text-xs text-subtle uppercase tracking-widest mb-1.5 block">Feedback count — {count}</span>
                <input
                    type="range"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-subtle mt-1">
                    <span>1</span><span>50</span><span>100</span>
                </div>
            </label>

            <button
                onClick={start}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 btn btn-primary btn-default"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
                {loading ? 'Generating…' : 'Start Simulation'}
            </button>

            <div className="text-xs text-subtle bg-black/20 rounded-lg px-3 py-2.5 leading-relaxed border border-border/40">
                Runs real <code className="text-primary/80">classifier.Classify</code> on fixture tag-pairs, writes to{' '}
                <code className="text-primary/80">feedback_history</code>, then triggers a scoped recompute on the sandbox chain.
            </div>
        </div>
    );
}
