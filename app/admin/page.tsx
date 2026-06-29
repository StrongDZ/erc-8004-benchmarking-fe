"use client";

import { useState } from "react";
import { Shield, RefreshCw, FlaskConical, CheckCircle, XCircle, Loader2, ExternalLink, Clock, KeyRound } from "lucide-react";
import { api } from "@/shared/api/client";
import type { RecomputeResult, SimulatorResult } from "@/shared/api/modules/admin";
import { SANDBOX_CHAIN_ID } from "@/shared/constants/app";

// ─── Types ──────────────────────────────────────────────────────────────────

type LogEntry =
    | { kind: "recompute"; ts: number; chainId: number; result: RecomputeResult }
    | { kind: "simulator"; ts: number; agentId: string; count: number; result: SimulatorResult }
    | { kind: "error"; ts: number; action: string; message: string };

// ─── Helpers ────────────────────────────────────────────────────────────────

function tsLabel(ts: number) {
    return new Date(ts).toLocaleTimeString();
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                {icon}
            </div>
            <div>
                <h2 className="text-base font-bold font-heading text-white">{title}</h2>
                <p className="text-xs text-muted mt-0.5">{sub}</p>
            </div>
        </div>
    );
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminPage() {
    // API key (overrides NEXT_PUBLIC_ADMIN_API_KEY when non-empty)
    const [apiKey, setApiKey] = useState<string>("");

    // Recompute state
    const [chainId, setChainId] = useState<string>("");
    const [recomputeLoading, setRecomputeLoading] = useState(false);

    // Simulator state
    const [simAgentId, setSimAgentId] = useState<string>("");
    const [simCount, setSimCount] = useState<number>(10);
    const [simLoading, setSimLoading] = useState(false);

    // Session activity log
    const [log, setLog] = useState<LogEntry[]>([]);

    function pushLog(entry: LogEntry) {
        setLog((prev) => [entry, ...prev].slice(0, 20));
    }

    async function handleRecompute() {
        setRecomputeLoading(true);
        try {
            const cid = chainId.trim() ? parseInt(chainId.trim(), 10) : 0;
            const res = await api.triggerRecompute(cid, apiKey.trim() || undefined);
            if (res.success && res.data) {
                pushLog({ kind: "recompute", ts: Date.now(), chainId: cid, result: res.data });
            } else {
                pushLog({ kind: "error", ts: Date.now(), action: "recompute", message: typeof res.error === "string" ? res.error : JSON.stringify(res.error) ?? "unknown error" });
            }
        } catch (e) {
            pushLog({ kind: "error", ts: Date.now(), action: "recompute", message: String(e) });
        } finally {
            setRecomputeLoading(false);
        }
    }

    async function handleSimulator() {
        setSimLoading(true);
        try {
            const res = await api.startSimulator(simAgentId.trim() || undefined, simCount, apiKey.trim() || undefined);
            if (res.success && res.data) {
                pushLog({ kind: "simulator", ts: Date.now(), agentId: res.data.agentId, count: res.data.count, result: res.data });
            } else {
                pushLog({ kind: "error", ts: Date.now(), action: "simulator", message: typeof res.error === "string" ? res.error : JSON.stringify(res.error) ?? "unknown error" });
            }
        } catch (e) {
            pushLog({ kind: "error", ts: Date.now(), action: "simulator", message: String(e) });
        } finally {
            setSimLoading(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                    <Shield size={18} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-white">Admin Controls</h1>
                    <p className="text-xs text-muted mt-0.5">Operator-only — requires X-API-Key (set via NEXT_PUBLIC_ADMIN_API_KEY)</p>
                </div>
            </div>

            {/* API key input */}
            <div className="flex items-center gap-3 bg-black/30 border border-border rounded-xl px-4 py-3">
                <KeyRound size={15} className="text-muted shrink-0" />
                <span className="text-xs text-muted shrink-0 w-24">API Key</span>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Leave empty to use NEXT_PUBLIC_ADMIN_API_KEY from env"
                    className="flex-1 bg-transparent border-none text-sm text-white outline-none placeholder:text-subtle"
                />
                {apiKey && (
                    <span className="text-xs text-success shrink-0">override active</span>
                )}
            </div>

            {/* Two action panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Score Recompute ── */}
                <div className="card px-6 py-5 space-y-5">
                    <SectionHeader
                        icon={<RefreshCw size={16} className="text-primary" />}
                        title="Score Recompute"
                        sub="Publish an on-demand replay to score-refresh worker. Runs asynchronously (seconds–minutes)."
                    />

                    <div className="space-y-3">
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
                            onClick={handleRecompute}
                            disabled={recomputeLoading}
                            className="w-full flex items-center justify-center gap-2 btn btn-primary btn-default"
                        >
                            {recomputeLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <RefreshCw size={14} />
                            )}
                            {recomputeLoading ? "Queuing…" : "Trigger Recompute"}
                        </button>
                    </div>

                    <div className="text-xs text-subtle bg-black/20 rounded-lg px-3 py-2.5 leading-relaxed border border-border/40">
                        Publishes to <code className="text-primary/80">erc8004.scorerefresh.trigger</code>. The score-refresh worker picks it up and replays <code className="text-primary/80">feedback_history</code> → recalculates composite scores.
                    </div>
                </div>

                {/* ── Simulator ── */}
                <div className="card px-6 py-5 space-y-5">
                    <SectionHeader
                        icon={<FlaskConical size={16} className="text-primary" />}
                        title="Scoring Simulator"
                        sub={`Injects synthetic feedback on sandbox chain (chainId ${SANDBOX_CHAIN_ID}) — never touches live data.`}
                    />

                    <div className="space-y-3">
                        <label className="block">
                            <span className="text-xs text-subtle uppercase tracking-widest mb-1.5 block">Agent ID (leave empty to auto-generate)</span>
                            <input
                                type="text"
                                value={simAgentId}
                                onChange={(e) => setSimAgentId(e.target.value)}
                                placeholder="sim-agent-0"
                                className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs text-subtle uppercase tracking-widest mb-1.5 block">
                                Feedback count — {simCount}
                            </span>
                            <input
                                type="range"
                                min={1}
                                max={100}
                                value={simCount}
                                onChange={(e) => setSimCount(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                            <div className="flex justify-between text-xs text-subtle mt-1">
                                <span>1</span><span>50</span><span>100</span>
                            </div>
                        </label>

                        <button
                            onClick={handleSimulator}
                            disabled={simLoading}
                            className="w-full flex items-center justify-center gap-2 btn btn-primary btn-default"
                        >
                            {simLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <FlaskConical size={14} />
                            )}
                            {simLoading ? "Generating…" : "Start Simulation"}
                        </button>
                    </div>

                    <div className="text-xs text-subtle bg-black/20 rounded-lg px-3 py-2.5 leading-relaxed border border-border/40">
                        Calls real <code className="text-primary/80">classifier.Classify</code> on 5 fixture tag-pairs, writes to <code className="text-primary/80">feedback_history</code>, then triggers a scoped recompute on the sandbox chain.
                    </div>
                </div>
            </div>

            {/* Activity log */}
            <div className="card px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-muted" />
                    <span className="text-xs uppercase tracking-widest text-muted font-medium">Session Activity Log</span>
                    {log.length > 0 && (
                        <button onClick={() => setLog([])} className="ml-auto text-xs text-subtle hover:text-muted transition-colors">
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

                                {entry.kind === "recompute" && (
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Recompute</span>
                                            <span className="text-xs text-muted">chain={entry.chainId === 0 ? "all" : entry.chainId}</span>
                                            <StatusBadge ok />
                                        </div>
                                        <p className="text-xs text-subtle mt-1 font-mono truncate">{entry.result.requestId}</p>
                                    </div>
                                )}

                                {entry.kind === "simulator" && (
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

                                {entry.kind === "error" && (
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-danger uppercase tracking-wide">{entry.action}</span>
                                            <StatusBadge ok={false} />
                                        </div>
                                        <p className="text-xs text-danger/70 mt-1 truncate">{entry.message}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
