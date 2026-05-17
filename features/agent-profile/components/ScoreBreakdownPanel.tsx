'use client';
import { ScoreBreakdown } from '@/shared/api/response-types';

interface ScoreBreakdownPanelProps {
    breakdown?: ScoreBreakdown | null;
    compositeScore: number;
    /** Compact mode for placement inside hero panels. Default false (standalone card). */
    variant?: 'standalone' | 'hero';
}

type ComponentTint = {
    cssVar: string;
    dimVar: string;
    glowVar: string;
};

interface ComponentDef {
    key: keyof ScoreBreakdown;
    label: string;
    weight: number; // 0.5, 0.2, ...
    weightLabel: string; // "50%"
    tint: ComponentTint;
}

const COMPONENTS: ComponentDef[] = [
    {
        key: 'reputation',
        label: 'Reputation',
        weight: 0.5,
        weightLabel: '50%',
        tint: {
            cssVar: 'var(--color-primary)',
            dimVar: 'var(--color-primary-dim)',
            glowVar: 'var(--color-primary-glow)',
        },
    },
    {
        key: 'services',
        label: 'Services',
        weight: 0.2,
        weightLabel: '20%',
        tint: {
            cssVar: 'var(--color-success)',
            dimVar: 'var(--color-success-dim)',
            glowVar: 'rgba(52, 211, 153, 0.4)',
        },
    },
    {
        key: 'publisher',
        label: 'Publisher',
        weight: 0.2,
        weightLabel: '20%',
        tint: {
            cssVar: 'var(--color-accent)',
            dimVar: 'var(--color-accent-dim)',
            glowVar: 'var(--color-accent-glow)',
        },
    },
    {
        key: 'compliance',
        label: 'Compliance',
        weight: 0.1,
        weightLabel: '10%',
        tint: {
            cssVar: 'var(--color-warning)',
            dimVar: 'var(--color-warning-dim)',
            glowVar: 'rgba(251, 191, 36, 0.4)',
        },
    },
];

const EMPTY: ScoreBreakdown = { reputation: 0, services: 0, publisher: 0, compliance: 0 };

export function ScoreBreakdownPanel({ breakdown, compositeScore, variant = 'standalone' }: ScoreBreakdownPanelProps) {
    const data = breakdown ?? EMPTY;
    const isPending = !breakdown;
    const sumContrib =
        data.reputation * 0.5 + data.services * 0.2 + data.publisher * 0.2 + data.compliance * 0.1;
    const isHero = variant === 'hero';

    return (
        <div className={`relative overflow-hidden ${isHero ? 'card-glass p-5' : 'card p-5'}`}>
            {/* Ambient glow behind composite */}
            <div
                className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full blur-3xl opacity-60"
                style={{ background: 'var(--color-primary-glow)' }}
                aria-hidden
            />

            {/* Headline: composite */}
            <div className="relative">
                <div className="flex items-end justify-between mb-1">
                    <span className="font-heading text-[10px] uppercase tracking-[0.28em] text-subtle">
                        Composite Trust
                    </span>
                    <span className="font-mono text-[10px] text-subtle">/100</span>
                </div>
                <div
                    className="font-heading font-bold text-primary leading-none tabular-nums"
                    style={{
                        fontSize: isHero ? '3.75rem' : '2.5rem',
                        textShadow: '0 0 32px var(--color-primary-glow)',
                    }}
                >
                    {compositeScore.toFixed(1)}
                </div>
                <div className="score-bar-wrap mt-3">
                    <div
                        className="score-bar-fill gold"
                        style={{ width: `${Math.max(0, Math.min(100, compositeScore))}%` }}
                    />
                </div>
            </div>

            {/* Receipt header */}
            <div className="relative mt-6 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-heading text-[10px] uppercase tracking-[0.28em] text-muted">
                        Score Composition
                    </span>
                    <div className="flex gap-4 font-heading text-[9px] uppercase tracking-[0.22em] text-subtle">
                        <span className="w-10 text-right">Value</span>
                        <span className="w-12 text-right">Contrib</span>
                    </div>
                </div>

                {/* Component rows */}
                <div className="flex flex-col gap-3">
                    {COMPONENTS.map(c => {
                        const raw = data[c.key];
                        const clamped = Math.max(0, Math.min(100, raw));
                        const contribution = raw * c.weight;
                        return (
                            <div key={c.key}>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="font-mono text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded"
                                            style={{
                                                background: c.tint.dimVar,
                                                color: c.tint.cssVar,
                                                border: `1px solid ${c.tint.cssVar}33`,
                                            }}
                                        >
                                            {c.weightLabel}
                                        </span>
                                        <span className="text-text font-medium">{c.label}</span>
                                    </div>
                                    <div className="flex gap-4 font-mono tabular-nums">
                                        <span className="text-muted w-10 text-right">{raw.toFixed(1)}</span>
                                        <span
                                            className="font-heading font-semibold w-12 text-right"
                                            style={{ color: c.tint.cssVar }}
                                        >
                                            +{contribution.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                                <div className="score-bar-wrap" style={{ height: '5px' }}>
                                    <div
                                        className="h-full rounded-[2px] transition-all duration-700"
                                        style={{
                                            width: `${clamped}%`,
                                            background: c.tint.cssVar,
                                            boxShadow: `0 0 10px ${c.tint.glowVar}`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sum row */}
                <div className="mt-5 pt-3 border-t border-dashed border-border-subtle flex items-center justify-between">
                    <span className="font-heading text-[10px] uppercase tracking-[0.28em] text-muted">
                        Σ Total
                    </span>
                    <span className="font-heading font-bold text-primary text-base tabular-nums">
                        {sumContrib.toFixed(1)}
                        <span className="text-xs text-subtle ml-1">/100</span>
                    </span>
                </div>

                {isPending && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-subtle">
                        <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: 'var(--color-warning)', boxShadow: '0 0 6px var(--color-warning)' }}
                        />
                        Awaiting next refresh cycle
                    </div>
                )}
            </div>
        </div>
    );
}
