'use client';

import { Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { SANDBOX_CHAIN_ID } from '@/shared/constants/app';
import type { RecomputeResult, SimulatorResult } from '@/shared/api/modules/admin';

export type LogEntry =
    | { kind: 'recompute'; ts: number; chainId: number; result: RecomputeResult }
    | { kind: 'simulator'; ts: number; agentId: string; count: number; result: SimulatorResult }
    | { kind: 'error'; ts: number; action: string; message: string };

function tsLabel(ts: number) {
    return new Date(ts).toLocaleTimeString();
}

function StatusBadge({ ok }: { ok: boolean }) {
    return ok ? (
        <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
            <CheckCircle size={12} /> queued
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs text-danger font-medium">
            <XCircle size={12} /> error
        </span>
    );
}

export function ActivityLog({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
    return (
        <div className="card px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-muted" />
                <span className="text-xs uppercase tracking-widest text-muted font-medium">Session Activity Log</span>
                {log.length > 0 && (
                    <button onClick={onClear} className="ml-auto text-xs text-subtle hover:text-muted transition-colors">
                        Clear
                    </button>
                )}
            </div>

            {log.length === 0 ? (
                <p className="text-sm text-subtle text-center py-8">No activity yet — trigger an action above.</p>
            ) : (
                <div className="space-y-2">
                    {log.map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg bg-black/20 border border-border/40 px-4 py-3">
                            <span className="text-xs text-subtle shrink-0 pt-0.5 tabular-nums">{tsLabel(entry.ts)}</span>

                            {entry.kind === 'recompute' && (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-primary uppercase tracking-wide">Recompute</span>
                                        <span className="text-xs text-muted">chain={entry.chainId === 0 ? 'all' : entry.chainId}</span>
                                        <StatusBadge ok />
                                    </div>
                                    <p className="text-xs text-subtle mt-1 font-mono truncate">{entry.result.requestId}</p>
                                </div>
                            )}

                            {entry.kind === 'simulator' && (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-accent uppercase tracking-wide">Simulator</span>
                                        <span className="text-xs text-muted">{entry.count} records</span>
                                        <StatusBadge ok />
                                        <a
                                            href={`/agents/${SANDBOX_CHAIN_ID}/${entry.agentId}`}
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline ml-auto"
                                        >
                                            View agent <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <p className="text-xs text-subtle mt-1 font-mono truncate">
                                        agentId={entry.agentId} · {entry.result.requestId}
                                    </p>
                                </div>
                            )}

                            {entry.kind === 'error' && (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-danger uppercase tracking-wide">{entry.action}</span>
                                        <StatusBadge ok={false} />
                                    </div>
                                    <p className="text-xs text-danger/70 mt-1 break-words">{entry.message}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
