'use client';
import { useEffect, useMemo, useState } from 'react';
import {
    api,
    AgentOverview,
    AgentProfile,
    ServiceOverview,
} from '@/shared/api/client';
import { ensureHttpsUrl } from '@/shared/api/utils/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { Skeleton } from '@/shared/ui/Skeleton';
import {
    AlertTriangle,
    Bot,
    CheckCircle,
    CircleHelp,
    Globe,
    Layers,
    Loader2,
    Plug,
    RefreshCw,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { ServiceReputationStrip } from '@/features/agent-profile/components/ServiceReputationStrip';

interface Props {
    chainId: number;
    agentId: string;
    profile: AgentProfile;
    onViewServiceFeedback?: (endpoint: string) => void;
}

type HealthKey = 'ok' | 'warning' | 'fail' | 'unknown';

const HEALTH_META: Record<
    HealthKey,
    { label: string; variant: 'success' | 'warning' | 'danger' | 'muted'; Icon: LucideIcon; chip: string }
> = {
    ok: {
        label: 'Healthy',
        variant: 'success',
        Icon: CheckCircle,
        chip: 'border-success/40 bg-success/15 text-success',
    },
    warning: {
        label: 'Non-JSON',
        variant: 'warning',
        Icon: AlertTriangle,
        chip: 'border-warning/40 bg-warning/15 text-warning',
    },
    fail: {
        label: 'Unreachable',
        variant: 'danger',
        Icon: XCircle,
        chip: 'border-danger/40 bg-danger/15 text-danger',
    },
    unknown: {
        label: 'Unknown',
        variant: 'muted',
        Icon: CircleHelp,
        chip: 'border-white/20 bg-white/10 text-white/75',
    },
};

function getServiceErrorDetail(service: ServiceOverview): string | undefined {
    const parts: string[] = [];
    if (service.healthInfo?.trim()) parts.push(service.healthInfo.trim());
    const probeErr = service.enrichment?.probe?.errorSummary?.trim();
    if (probeErr && !parts.some((p) => p.includes(probeErr))) {
        parts.push(probeErr);
    }
    return parts.length > 0 ? parts.join('\n') : undefined;
}

function getServiceDescription(service: ServiceOverview): string | undefined {
    const e = service.enrichment;
    return e?.description?.trim() || e?.pageDescription?.trim() || undefined;
}

function HealthPill({ service }: { service: ServiceOverview }) {
    const cfg = HEALTH_META[service.health] ?? HEALTH_META.unknown;
    const errorDetail = getServiceErrorDetail(service);
    const showErrorTooltip = service.health === 'fail' && errorDetail;

    const badge = (
        <Badge variant={cfg.variant} size="sm" className={showErrorTooltip ? 'cursor-help' : undefined}>
            <cfg.Icon size={10} /> {cfg.label}
        </Badge>
    );

    if (!showErrorTooltip) return badge;

    return (
        <span className="relative inline-flex group">
            {badge}
            <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-max max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-danger/30 bg-elevated px-2.5 py-2 text-left text-3xs font-normal normal-case tracking-normal text-white/90 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 sm:max-w-md max-h-48 overflow-y-auto"
            >
                <span className="block whitespace-pre-wrap break-words">{errorDetail}</span>
            </span>
        </span>
    );
}

function ServicesSummaryBar({
    total,
    counts,
    score,
}: {
    total: number;
    counts: Record<HealthKey, number>;
    score: number;
}) {
    const statusOrder: HealthKey[] = ['ok', 'warning', 'fail', 'unknown'];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/14 via-[#0c1222] to-accent/10 p-5 shadow-[0_0_28px_-10px_rgba(168,85,247,0.45)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 min-w-0">
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center justify-center w-11 h-11 rounded-xl border border-primary/30 bg-primary/15 text-primary">
                            <Layers size={20} />
                        </span>
                        <div>
                            <p className="text-3xs uppercase tracking-widest text-subtle font-semibold">
                                Services overview
                            </p>
                            <p className="text-3xl font-bold font-heading text-white tabular-nums leading-none">
                                {total}
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-12 bg-white/10 shrink-0" />

                    <div className="flex flex-wrap gap-2 min-w-0">
                        {statusOrder.map((key) => {
                            const meta = HEALTH_META[key];
                            const count = counts[key];
                            return (
                                <div
                                    key={key}
                                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${meta.chip}`}
                                >
                                    <meta.Icon size={14} className="shrink-0" />
                                    <span className="text-3xs uppercase tracking-wider font-semibold opacity-90">
                                        {meta.label}
                                    </span>
                                    <span className="text-base font-bold font-heading tabular-nums leading-none">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 shrink-0 self-start lg:self-center">
                    <div className="text-right">
                        <p className="text-3xs uppercase tracking-widest text-accent/80 font-semibold">
                            Services score
                        </p>
                        <p className="text-2xl font-bold font-heading text-white tabular-nums leading-none">
                            {score.toFixed(1)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const RECONNECT_COOLDOWN_SECONDS = 15;

function ReconnectButton({
    chainId,
    agentId,
    endpoint,
    onResult,
}: {
    chainId: number;
    agentId: string;
    endpoint: string;
    onResult: (svc: ServiceOverview) => void;
}) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'cooldown'>('idle');
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (status !== 'cooldown') return;
        if (secondsLeft <= 0) {
            setStatus('idle');
            return;
        }
        const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [status, secondsLeft]);

    const handleClick = async () => {
        setStatus('loading');
        try {
            const res = await api.reconnectServiceEndpoint(chainId, agentId, endpoint);
            if (res.success && res.data) {
                onResult(res.data);
            }
        } catch {
            // fall through to cooldown
        } finally {
            setSecondsLeft(RECONNECT_COOLDOWN_SECONDS);
            setStatus('cooldown');
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={status !== 'idle'}
            className="shrink-0 text-xs"
        >
            {status === 'loading' ? (
                <Loader2 size={12} className="animate-spin" />
            ) : (
                <RefreshCw size={12} />
            )}
            {status === 'cooldown' ? `Retry in ${secondsLeft}s` : 'Reconnect'}
        </Button>
    );
}

const OASF_CHIP_LIMIT = 10;

function ChipList({
    items,
    label,
    limit,
}: {
    items?: string[];
    label: string;
    limit?: number;
}) {
    const [expanded, setExpanded] = useState(false);
    if (!items?.length) return null;

    const capped = limit != null && items.length > limit;
    const visible = capped && !expanded ? items.slice(0, limit) : items;

    return (
        <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-3xs uppercase tracking-wider text-subtle shrink-0">{label}</span>
            {visible.map((item) => (
                <Badge key={item} variant="muted" size="xs">
                    {item}
                </Badge>
            ))}
            {capped && (
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-3xs text-accent hover:text-primary transition-colors"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
}

/** Common enrichment fields shared by every protocol card body. */
function ServiceDetails({
    svc,
    chipListLimit,
}: {
    svc: ServiceOverview;
    chipListLimit?: number;
}) {
    const e = svc.enrichment;
    const description = getServiceDescription(svc);

    return (
        <div className="space-y-2">
            {description && (
                <p className="text-sm text-muted leading-relaxed">{description}</p>
            )}
            {e?.protocol && (
                <p className="text-xs text-subtle">Protocol: <span className="text-white/80">{e.protocol}</span></p>
            )}
            {e?.provider && (
                <p className="text-xs text-subtle">Provider: <span className="text-white/80">{e.provider}</span></p>
            )}
            {e?.pageTitle && (
                <p className="text-xs text-subtle">Page: <span className="text-white/80">{e.pageTitle}</span></p>
            )}
            <ChipList items={e?.tools} label="Tools" />
            {e?.toolCount != null && e.toolCount > (e.tools?.length ?? 0) && (
                <span className="text-3xs text-subtle">+{e.toolCount - (e.tools?.length ?? 0)} more tools</span>
            )}
            <ChipList items={e?.prompts} label="Prompts" />
            <ChipList
                items={e?.skillPaths?.length ? e.skillPaths : svc.skills}
                label="Skills"
                limit={chipListLimit}
            />
            <ChipList
                items={e?.domainPaths?.length ? e.domainPaths : svc.domains}
                label="Domains"
                limit={chipListLimit}
            />
            <ChipList items={e?.capabilities} label="Capabilities" />
            <ChipList items={e?.inputModes} label="Input modes" />
            <ChipList items={e?.outputModes} label="Output modes" />
            <ChipList items={e?.authSchemes} label="Auth" />
            {e?.x402?.enabled && (
                <div className="text-xs text-subtle flex flex-wrap gap-x-3 gap-y-1">
                    <span>x402</span>
                    {e.x402.chain && <span>{e.x402.chain}</span>}
                    {e.x402.currency && <span>{e.x402.currency}</span>}
                    {e.x402.fee && <span>fee {e.x402.fee}</span>}
                </div>
            )}
            {svc.endpoint ? (
                <LinkOutbound
                    href={ensureHttpsUrl(svc.endpoint)}
                    external
                    className="text-xs text-accent hover:text-primary transition-colors font-mono"
                >
                    <Globe size={12} className="shrink-0 flex-none" aria-hidden />
                    <span className="min-w-0 break-all">{svc.endpoint}</span>
                </LinkOutbound>
            ) : (
                <span className="text-xs text-subtle">No endpoint declared</span>
            )}
        </div>
    );
}

interface ProtocolDef {
    label: string;
    Icon: LucideIcon;
    accent: string;
}

const PROTOCOL_DEFS: Record<'a2a' | 'oasf' | 'mcp' | 'web', ProtocolDef> = {
    a2a: { label: 'A2A', Icon: Bot, accent: 'text-primary border-primary/30 bg-primary/10' },
    oasf: { label: 'OASF', Icon: Layers, accent: 'text-success border-success/30 bg-success/10' },
    mcp: { label: 'MCP', Icon: Plug, accent: 'text-accent border-accent/30 bg-accent/10' },
    web: { label: 'Web', Icon: Globe, accent: 'text-white/80 border-white/15 bg-white/5' },
};

const PROTOCOL_ORDER = ['a2a', 'oasf', 'mcp', 'web'] as const;

function ProtocolCard({
    protocolKey,
    svc,
    chainId,
    agentId,
    onUpdate,
    onViewServiceFeedback,
}: {
    protocolKey: keyof typeof PROTOCOL_DEFS;
    svc: ServiceOverview;
    chainId: number;
    agentId: string;
    onUpdate: (updated: ServiceOverview) => void;
    onViewServiceFeedback?: (endpoint: string) => void;
}) {
    const def = PROTOCOL_DEFS[protocolKey];
    const e = svc.enrichment;

    return (
        <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${def.accent}`}>
                        <def.Icon size={16} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium text-sm">{def.label}</span>
                            {svc.version && <Badge variant="muted" size="xs">v{svc.version}</Badge>}
                            {e?.method && <Badge variant="muted" size="xs">{e.method}</Badge>}
                            {e?.paymentRequired === true && <Badge variant="warning" size="xs">Paid</Badge>}
                            {e?.paymentRequired === false && <Badge variant="success" size="xs">Free</Badge>}
                        </div>
                        {svc.name && svc.name.toLowerCase() !== protocolKey && (
                            <span className="text-3xs text-subtle">{svc.name}</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <HealthPill service={svc} />
                    {svc.endpoint && (
                        <ReconnectButton chainId={chainId} agentId={agentId} endpoint={svc.endpoint} onResult={onUpdate} />
                    )}
                </div>
            </div>

            <ServiceReputationStrip svc={svc} onViewFeedback={onViewServiceFeedback} />

            {protocolKey === 'web' && e?.pageImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={e.pageImage}
                    alt=""
                    className="w-10 h-10 rounded-md object-cover border border-white/10"
                />
            )}

            <ServiceDetails
                svc={svc}
                chipListLimit={protocolKey === 'oasf' ? OASF_CHIP_LIMIT : undefined}
            />
        </div>
    );
}

function CustomServicesCard({
    services,
    chainId,
    agentId,
    onUpdate,
    onViewServiceFeedback,
}: {
    services: ServiceOverview[];
    chainId: number;
    agentId: string;
    onUpdate: (updated: ServiceOverview) => void;
    onViewServiceFeedback?: (endpoint: string) => void;
}) {
    if (services.length === 0) return null;

    return (
        <div className="card p-5">
            <h3 className="text-sm font-medium text-white mb-2">Other services</h3>
            {services.map((svc, idx) => {
                const e = svc.enrichment;
                const description = getServiceDescription(svc);

                return (
                    <div key={`${svc.name}-${idx}`} className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 border-b border-white/5 last:border-0">
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium text-sm truncate">{svc.name || 'Unnamed service'}</span>
                                {svc.version && <Badge variant="muted" size="xs">v{svc.version}</Badge>}
                                {e?.method && <Badge variant="muted" size="xs">{e.method}</Badge>}
                                {e?.paymentRequired === true && <Badge variant="warning" size="xs">Paid</Badge>}
                                {e?.paymentRequired === false && <Badge variant="success" size="xs">Free</Badge>}
                                <HealthPill service={svc} />
                            </div>
                            {description && (
                                <p className="text-xs text-muted truncate">{description}</p>
                            )}
                            {svc.endpoint && (
                                <LinkOutbound
                                    href={ensureHttpsUrl(svc.endpoint)}
                                    external
                                    className="text-xs text-accent hover:text-primary transition-colors font-mono"
                                >
                                    <Globe size={12} className="shrink-0 flex-none" aria-hidden />
                                    <span className="min-w-0 truncate">{svc.endpoint}</span>
                                </LinkOutbound>
                            )}
                            <ServiceReputationStrip
                                svc={svc}
                                onViewFeedback={onViewServiceFeedback}
                                compact
                            />
                        </div>
                        {svc.endpoint && (
                            <ReconnectButton chainId={chainId} agentId={agentId} endpoint={svc.endpoint} onResult={onUpdate} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ServicesTab({ chainId, agentId, profile, onViewServiceFeedback }: Props) {
    const [data, setData] = useState<AgentOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.agentOverview(chainId, agentId).then((r) => {
            setData(r.data ?? null);
            setLoading(false);
        });
    }, [chainId, agentId]);

    const healthCounts = useMemo(() => {
        const counts = { ok: 0, warning: 0, fail: 0, unknown: 0 };
        for (const s of data?.services ?? []) {
            counts[s.health] = (counts[s.health] ?? 0) + 1;
        }
        return counts;
    }, [data?.services]);

    const { protocolServices, customServices } = useMemo(() => {
        const protocolServices = new Map<(typeof PROTOCOL_ORDER)[number], ServiceOverview>();
        const customServices: ServiceOverview[] = [];
        for (const svc of data?.services ?? []) {
            const normalized = (svc.name ?? '').trim().toLowerCase();
            const key = PROTOCOL_ORDER.find((k) => k === normalized);
            if (key && !protocolServices.has(key)) {
                protocolServices.set(key, svc);
            } else {
                customServices.push(svc);
            }
        }
        customServices.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        return { protocolServices, customServices };
    }, [data?.services]);

    if (loading) {
        return <Skeleton className="h-64 w-full rounded-2xl" />;
    }

    if (!data) {
        return <div className="card p-6 text-center text-muted text-sm">No services data available.</div>;
    }

    const servicesScore = profile.scoring.scoreBreakdown.services;

    const handleUpdate = (updated: ServiceOverview) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                services: prev.services.map((s) =>
                    s.endpoint === updated.endpoint ? updated : s,
                ),
            };
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <ServicesSummaryBar
                total={data.services.length}
                counts={healthCounts}
                score={servicesScore}
            />

            {data.services.length === 0 ? (
                <div className="card p-5">
                    <p className="text-muted text-sm py-4">No services registered for this agent.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {PROTOCOL_ORDER.map((key) => {
                            const svc = protocolServices.get(key);
                            if (!svc) return null;
                            return (
                                <ProtocolCard
                                    key={key}
                                    protocolKey={key}
                                    svc={svc}
                                    chainId={chainId}
                                    agentId={agentId}
                                    onUpdate={handleUpdate}
                                    onViewServiceFeedback={onViewServiceFeedback}
                                />
                            );
                        })}
                    </div>
                    <CustomServicesCard
                        services={customServices}
                        chainId={chainId}
                        agentId={agentId}
                        onUpdate={handleUpdate}
                        onViewServiceFeedback={onViewServiceFeedback}
                    />
                </>
            )}
        </div>
    );
}
