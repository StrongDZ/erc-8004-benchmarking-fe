'use client';
import { useEffect, useState } from 'react';

import {
    api,
    AgentOverview,
    truncateAddress,
    explorerUrl,
} from '@/shared/api/client';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { Skeleton } from '@/shared/ui/Skeleton';
import { AddressLabel } from '@/shared/ui/AddressLabel';

interface Props { chainId: number; agentId: string; }

function InfoRow({ label, children, copyValue }: { label: string; children: React.ReactNode; copyValue?: string }) {
    const [copied, copy] = useCopyToClipboard();
    const handleCopy = () => { if (copyValue) copy(copyValue); };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)_auto] gap-1 sm:gap-3 items-center py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs uppercase tracking-wider text-subtle truncate" title={label}>{label}</span>
            <div className="text-sm text-white min-w-0 [&>*]:max-w-full">{children}</div>
            {copyValue ? (
                <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs px-2 py-1 rounded-md border border-white/10 text-subtle hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                    aria-label={`Copy value for ${label}`}
                    title={copied ? 'Copied' : 'Copy value'}
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            ) : (
                <span />
            )}
        </div>
    );
}

function formatValue(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value === null) return 'null';
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function PrimitiveValue({ value }: { value: unknown }) {
    return (
        <span className="font-mono text-xs block truncate" title={formatValue(value)}>
            {formatValue(value)}
        </span>
    );
}

/** true = string | number | boolean | null (no nested structure to expand) */
function isJsonLeaf(value: unknown): boolean {
    if (value === null) return true;
    if (Array.isArray(value)) return false;
    if (typeof value === 'object') return false;
    return true;
}

function jsonStructureLabel(value: unknown): string {
    if (Array.isArray(value)) return `Array (${value.length})`;
    if (value && typeof value === 'object') {
        return `Object (${Object.keys(value as Record<string, unknown>).length})`;
    }
    return '';
}

function JsonTree({ data, level = 0 }: { data: unknown; level?: number }) {
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return <span className="font-mono text-xs text-subtle">[]</span>;
        }
        return (
            <div className="space-y-1.5">
                {data.map((item, idx) =>
                    isJsonLeaf(item) ? (
                        <div key={`${level}-${idx}`} className="flex items-baseline gap-2 min-w-0 text-xs">
                            <span className="text-subtle shrink-0 font-mono">[{idx}]</span>
                            <div className="min-w-0 flex-1 text-white">
                                <PrimitiveValue value={item} />
                            </div>
                        </div>
                    ) : (
                        <details key={`${level}-${idx}`} className="group">
                            <summary className="cursor-pointer text-xs text-subtle hover:text-white transition-colors font-mono">
                                <span className="inline-flex items-baseline gap-2 min-w-0 align-middle">
                                    <span className="shrink-0">[{idx}]</span>
                                    <span className="shrink-0 text-accent">{jsonStructureLabel(item)}</span>
                                </span>
                            </summary>
                            <div className="pl-4 pt-1 border-l border-white/10">
                                <JsonTree data={item} level={level + 1} />
                            </div>
                        </details>
                    ),
                )}
            </div>
        );
    }

    if (data && typeof data === 'object') {
        const entries = Object.entries(data as Record<string, unknown>);
        if (entries.length === 0) {
            return <span className="font-mono text-xs text-subtle">{'{}'}</span>;
        }
        return (
            <div className="space-y-1.5">
                {entries.map(([key, value]) =>
                    isJsonLeaf(value) ? (
                        <div key={`${level}-${key}`} className="flex items-baseline gap-2 min-w-0 text-xs">
                            <span className="text-subtle shrink-0 max-w-[45%] truncate" title={key}>
                                {key}
                            </span>
                            <div className="min-w-0 flex-1 text-white">
                                <PrimitiveValue value={value} />
                            </div>
                        </div>
                    ) : (
                        <details key={`${level}-${key}`} className="group">
                            <summary
                                className="cursor-pointer text-xs text-subtle hover:text-white transition-colors"
                                title={key}
                            >
                                <span className="inline-flex items-baseline gap-2 min-w-0 max-w-full align-middle">
                                    <span className="truncate">{key}</span>
                                    <span className="shrink-0 font-mono text-accent">{jsonStructureLabel(value)}</span>
                                </span>
                            </summary>
                            <div className="pl-4 pt-1 border-l border-white/10">
                                <JsonTree data={value} level={level + 1} />
                            </div>
                        </details>
                    ),
                )}
            </div>
        );
    }

    return <PrimitiveValue value={data} />;
}

function ExpandableValue({ value }: { value: unknown }) {
    if (!Array.isArray(value) && (!value || typeof value !== 'object')) {
        return <PrimitiveValue value={value} />;
    }

    const label = jsonStructureLabel(value);

    return (
        <details className="group">
            <summary className="cursor-pointer text-xs text-accent hover:text-primary transition-colors font-mono">
                {label}
            </summary>
            <div className="mt-2 rounded-md border border-white/10 bg-black/20 p-2 max-h-56 overflow-auto">
                <JsonTree data={value} />
            </div>
        </details>
    );
}

function MetadataRow({ label, value, rowKey }: { label: string; value: unknown; rowKey: string }) {
    const [copied, copy] = useCopyToClipboard();
    const handleCopy = () => copy(formatValue(value));

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)_auto] gap-2 sm:gap-3 items-start py-2.5 border-b border-white/5 last:border-0">
            <span className="text-xs uppercase tracking-wider text-subtle truncate" title={label}>
                {label}
            </span>
            <div className="min-w-0">
                <ExpandableValue value={value} />
            </div>
            <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-2 py-1 rounded-md border border-white/10 text-subtle hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                aria-label={`Copy value for ${rowKey}`}
                title={copied ? 'Copied' : 'Copy value'}
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}

function MetadataGrid({ title, entries }: { title: string; entries: Array<[string, unknown]> }) {
    if (!entries.length) return null;
    return (
        <div className="card p-5">
            <h3 className="font-heading text-lg text-white mb-3">{title}</h3>
            <div className="flex flex-col">
                {entries.map(([k, v]) => (
                    <MetadataRow key={k} rowKey={k} label={k} value={v} />
                ))}
            </div>
        </div>
    );
}

// Flatten `offchainMetadata` (arbitrary JSON) into displayable string rows.
function flattenOffchain(obj: Record<string, unknown> | undefined): Array<[string, unknown]> {
    if (!obj) return [];
    // Keys already rendered elsewhere on the page; skip to avoid duplicates.
    const SKIP = new Set(['name', 'description', 'image', 'website']);
    return Object.entries(obj)
        .filter(([k]) => !SKIP.has(k))
        .map(([k, v]) => [k, v] as [string, unknown]);
}

function flattenOnchain(obj: Record<string, { decoded?: unknown; rawHex?: string }> | undefined): Array<[string, unknown]> {
    if (!obj) return [];
    return Object.entries(obj).map(([k, v]) => {
        const val =
            v.decoded !== undefined && v.decoded !== null ? v.decoded : (v.rawHex ?? '');
        return [k, val] as [string, unknown];
    });
}

export default function OverviewTab({ chainId, agentId }: Props) {
    const [data, setData] = useState<AgentOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.agentOverview(chainId, agentId).then(r => {
            setData(r.data ?? null);
            setLoading(false);
        });
    }, [chainId, agentId]);

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        );
    }

    if (!data) {
        return <div className="card p-6 text-center text-muted text-sm">No overview available.</div>;
    }

    const onchainEntries = flattenOnchain(data.onchainMetadata);
    const offchainEntries = flattenOffchain(data.offchainMetadata);

    return (
        <div className="flex flex-col gap-6">
            {/* Basic information */}
            <div className="card p-5">
                <h3 className="font-heading text-lg text-white mb-3">Basic Information</h3>
                <div className="flex flex-col">
                    <InfoRow label="Agent ID" copyValue={`#${data.agentId}`}>
                        <span className="font-mono block truncate" title={`#${data.agentId}`}>#{data.agentId}</span>
                    </InfoRow>
                    <InfoRow label="Chain ID" copyValue={String(data.chainId)}>
                        <span className="font-mono block truncate" title={String(data.chainId)}>{data.chainId}</span>
                    </InfoRow>
                    {data.owner && (
                        <InfoRow label="Owner" copyValue={data.owner}>
                            <AddressLabel
                                address={data.owner}
                                chars={10}
                                className="font-mono text-xs truncate text-muted hover:text-primary transition-colors min-w-0 max-w-full inline-block"
                            />
                        </InfoRow>
                    )}
                    {data.agentWallet && (
                        <InfoRow label="Agent Wallet" copyValue={data.agentWallet}>
                            <AddressLabel
                                address={data.agentWallet}
                                chars={10}
                                className="font-mono text-xs truncate text-muted hover:text-primary transition-colors min-w-0 max-w-full inline-block"
                            />
                        </InfoRow>
                    )}
                    {data.createdTx && (
                        <InfoRow label="Created Tx" copyValue={data.createdTx}>
                            <span className="inline-flex items-center gap-2 min-w-0 max-w-full">
                                <LinkOutbound
                                    href={explorerUrl(data.chainId, data.createdTx)}
                                    external
                                    className="font-mono text-xs truncate text-muted hover:text-primary transition-colors min-w-0"
                                    title={data.createdTx}
                                >
                                    {truncateAddress(data.createdTx, 10)}
                                </LinkOutbound>
                            </span>
                        </InfoRow>
                    )}
                    {data.createdAt && (
                        <InfoRow label="Created At" copyValue={new Date(data.createdAt).toLocaleString()}>
                            <span className="block truncate" title={new Date(data.createdAt).toLocaleString()}>
                                {new Date(data.createdAt).toLocaleString()}
                            </span>
                        </InfoRow>
                    )}
                    {data.agentURI && (
                        <InfoRow label="Agent URI" copyValue={data.agentURI}>
                            <span className="font-mono text-xs block truncate" title={data.agentURI}>{data.agentURI}</span>
                        </InfoRow>
                    )}
                </div>
            </div>

            <MetadataGrid title="On-chain Metadata" entries={onchainEntries} />
            <MetadataGrid title="Off-chain Metadata" entries={offchainEntries} />
        </div>
    );
}
