'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, Pause, Play, Server, AlertTriangle } from 'lucide-react';
import { api } from '@/shared/api/client';
import type { IndexerStatusResponse } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import { ChainBadge } from '@/shared/ui/ChainBadge';

const POLL_MS = 10_000;

function relTime(iso?: string): string {
    if (!iso) return '—';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '—';
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

// Staleness color: fresh < 5m, warm < 30m, stale otherwise.
function staleClass(iso?: string): string {
    if (!iso) return 'text-subtle';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return 'text-subtle';
    const mins = (Date.now() - t) / 60000;
    if (mins < 5) return 'text-success';
    if (mins < 30) return 'text-warning';
    return 'text-danger';
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-heading text-2xl font-bold text-white tabular-nums">{value}</span>
            <span className="text-3xs uppercase tracking-widest text-subtle">{label}</span>
        </div>
    );
}

export function IndexerStatusPanel() {
    const { chains: knownChains } = useChain();
    const chainMeta = useMemo(
        () => new Map(knownChains.map((c) => [c.chainId, c])),
        [knownChains],
    );

    const [data, setData] = useState<IndexerStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.indexerStatus();
            if (res.success && res.data) {
                setData(res.data);
                setError('');
                setLastUpdated(Date.now());
            } else {
                setError(typeof res.error === 'string' ? res.error : 'Failed to load indexer status');
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(fetchStatus, POLL_MS);
        return () => clearInterval(id);
    }, [paused, fetchStatus]);

    // Sort by name — Go marshals maps in random order, which would reshuffle the
    // worker chips on every poll otherwise.
    const workers = data ? Object.entries(data.workers).sort((a, b) => a[0].localeCompare(b[0])) : [];

    return (
        <div className="card px-6 py-5">
            {/* header */}
            <div className="flex items-center gap-3 flex-wrap mb-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    <Activity size={16} className="text-primary" />
                </div>
                <div className="mr-auto">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold font-heading text-white">Indexer Status</h2>
                        <span className="inline-flex items-center gap-1.5 text-2xs text-subtle">
                            <span className={`w-1.5 h-1.5 rounded-full ${!paused ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                            {paused ? 'paused' : 'live'}
                        </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                        Auto-refreshes every {POLL_MS / 1000}s
                        {lastUpdated && <span className="text-subtle"> · updated {relTime(new Date(lastUpdated).toISOString())}</span>}
                    </p>
                </div>
                <button
                    onClick={() => setPaused((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/5 px-2.5 py-1.5 text-2xs font-medium text-muted hover:text-white transition-colors"
                >
                    {paused ? <Play size={13} /> : <Pause size={13} />}
                    {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                    onClick={fetchStatus}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/5 px-2.5 py-1.5 text-2xs font-medium text-muted hover:text-primary transition-colors"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mb-4">
                    <AlertTriangle size={13} /> {error}
                </div>
            )}

            {loading && !data ? (
                <div className="skeleton h-24 w-full rounded-lg" />
            ) : data ? (
                <>
                    {/* top metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 mb-5 border-b border-border">
                        <Metric label="Events 24h" value={data.events24h.toLocaleString()} />
                        <Metric label="Feedbacks 24h" value={data.feedbacks24h.toLocaleString()} />
                        <Metric label="Chains" value={data.chains.length} />
                        <Metric label="Workers up" value={`${workers.filter(([, w]) => w.running).length}/${workers.length}`} />
                    </div>

                    {/* workers */}
                    {workers.length > 0 && (
                        <div className="mb-5">
                            <span className="text-3xs uppercase tracking-widest text-subtle flex items-center gap-1.5 mb-2">
                                <Server size={11} /> Workers
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {workers.map(([name, w]) => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-2 rounded-md border border-border bg-black/20 px-2.5 py-1.5 text-2xs"
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${w.running ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                                        <span className="text-white font-medium">{name}</span>
                                        {w.cursor && (
                                            <span className="text-subtle font-mono">
                                                {w.cursor.blockNumber.toLocaleString()}:{w.cursor.logIndex}
                                            </span>
                                        )}
                                        <span className={w.running ? 'text-subtle' : 'text-danger font-medium'}>
                                            {w.running
                                                ? w.lastSeen
                                                    ? relTime(new Date(w.lastSeen * 1000).toISOString())
                                                    : 'up'
                                                : 'down'}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* per-chain table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-3xs uppercase tracking-widest text-subtle border-b border-border">
                                    <th className="text-left font-medium py-2 pr-3">Chain</th>
                                    <th className="text-left font-medium py-2 px-3">Chain ID</th>
                                    <th className="text-right font-medium py-2 px-3">Last Block</th>
                                    <th className="text-right font-medium py-2 px-3">Agents</th>
                                    <th className="text-right font-medium py-2 px-3">Feedback</th>
                                    <th className="text-right font-medium py-2 pl-3">Last Indexed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.chains.map((c) => (
                                    <tr key={c.chainId} className="border-b border-border/40 last:border-0">
                                        <td className="py-2.5 pr-3">
                                            <ChainBadge chainId={c.chainId} chain={chainMeta.get(c.chainId) ?? null} />
                                        </td>
                                        <td className="py-2.5 px-3 text-left text-muted font-mono tabular-nums">{c.chainId}</td>
                                        <td className="py-2.5 px-3 text-right text-muted font-mono tabular-nums">
                                            {c.lastProcessedBlock.toLocaleString()}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-muted tabular-nums">{c.agentCount.toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-right text-muted tabular-nums">{c.feedbackCount.toLocaleString()}</td>
                                        <td className={`py-2.5 pl-3 text-right tabular-nums ${staleClass(c.lastIndexedAt)}`}>
                                            {relTime(c.lastIndexedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : null}
        </div>
    );
}
