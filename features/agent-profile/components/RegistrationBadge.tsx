'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { api } from '@/shared/api/client';
import type { AgentRegistration, AgentRegistrationList } from '@/shared/api/types';
import { chainDisplayMeta } from '@/shared/api/utils/chains';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props {
    currentChainId: number;
    currentAgentId: string;
}

function ChainIcon({ chainId, size = 16 }: { chainId: number; size?: number }) {
    const meta = chainDisplayMeta(chainId);
    if (!meta.iconUrl) {
        return (
            <span
                className="inline-flex items-center justify-center rounded-full bg-muted/30 text-[8px] font-bold text-muted uppercase"
                style={{ width: size, height: size }}
            >
                {meta.shortName?.slice(0, 2) ?? '?'}
            </span>
        );
    }
    return (
        <Image
            src={meta.iconUrl}
            alt={meta.name ?? String(chainId)}
            width={size}
            height={size}
            className="rounded-full"
            unoptimized
        />
    );
}

function PopoverRow({
    reg,
    onNavigate,
}: {
    reg: AgentRegistration;
    onNavigate: () => void;
}) {
    const meta = chainDisplayMeta(reg.chainId);
    const rowContent = (
        <div className="flex items-center gap-2 px-3 py-2 w-full">
            <ChainIcon chainId={reg.chainId} size={18} />
            <span className="text-sm font-medium text-white min-w-[80px]">{meta.name}</span>
            <span className="text-xs text-muted font-mono flex-1">#{reg.agentId}</span>
            {reg.active ? (
                <Badge variant="success" size="xs">Active</Badge>
            ) : (
                <Badge variant="danger" size="xs">Inactive</Badge>
            )}
            {reg.isCurrent && (
                <span className="text-xs text-primary font-semibold ml-1">← Current</span>
            )}
        </div>
    );

    if (reg.isCurrent) {
        return (
            <div className="border border-primary/40 rounded-lg bg-primary/5">
                {rowContent}
            </div>
        );
    }

    return (
        <Link
            href={`/agents/${reg.chainId}/${reg.agentId}`}
            onClick={onNavigate}
            className="block rounded-lg hover:bg-white/5 transition-colors"
        >
            {rowContent}
        </Link>
    );
}

export function RegistrationBadge({ currentChainId, currentAgentId }: Props) {
    const [data, setData] = useState<AgentRegistrationList | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        api.agentRegistrations(currentChainId, currentAgentId)
            .then(res => {
                if (!cancelled) setData(res.data);
            })
            .catch(() => {
                if (!cancelled) setData(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [currentChainId, currentAgentId]);

    useEffect(() => {
        if (!open) return;
        const onMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    if (loading) {
        return <Skeleton className="h-6 w-32 rounded-full" />;
    }

    if (!data || data.registrations.length === 0) return null;

    const regs = data.registrations;
    const n = regs.length;
    const firstChain = chainDisplayMeta(regs[0].chainId);

    if (n === 1) {
        return (
            <span className="inline-flex items-center gap-1.5 badge badge-muted border rounded-full text-[11px] px-2.5 py-1 uppercase tracking-wide font-semibold">
                <ChainIcon chainId={regs[0].chainId} size={13} />
                Registered on {firstChain.name}
            </span>
        );
    }

    return (
        <div ref={containerRef} className="relative inline-flex">
            <button
                onClick={() => setOpen(v => !v)}
                className="inline-flex items-center gap-1.5 badge badge-muted border rounded-full text-[11px] px-2.5 py-1 uppercase tracking-wide font-semibold hover:border-primary/50 transition-colors cursor-pointer"
            >
                {regs.slice(0, 2).map(r => (
                    <ChainIcon key={r.chainId} chainId={r.chainId} size={13} />
                ))}
                {n > 2 && <span>+{n - 2}</span>}
                <span>Registered on {n} chains</span>
                <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[420px] card border border-border/60 shadow-xl p-2 flex flex-col gap-1">
                    {regs.map(reg => (
                        <PopoverRow
                            key={`${reg.chainId}-${reg.agentId}`}
                            reg={reg}
                            onNavigate={() => setOpen(false)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
