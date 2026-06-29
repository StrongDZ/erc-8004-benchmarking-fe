'use client';
import { ScoreBreakdown } from '@/shared/api/response-types';
import {
    DEFAULT_COMPOSITE_WEIGHTS,
    clampScore,
    computeCompositeFromBreakdown,
} from '@/shared/lib/compositeScore';

interface ScoreBreakdownPanelProps {
    breakdown?: ScoreBreakdown | null;
    compositeScore: number;
    /** Quality (reputation) is present when the agent has scored service feedback (B > 0 on BE). */
    qualityPresent?: boolean;
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
    weight: number;
    weightLabel: string;
    tint: ComponentTint;
    /** When false, component weight is renormalized out of the composite (BE quality axis). */
    optional?: boolean;
}

const COMPONENTS: ComponentDef[] = [
    {
        key: 'reputation',
        label: 'Reputation',
        weight: DEFAULT_COMPOSITE_WEIGHTS.reputation,
        weightLabel: '40%',
        optional: true,
        tint: {
            cssVar: 'var(--color-primary)',
            dimVar: 'var(--color-primary-dim)',
            glowVar: 'var(--color-primary-glow)',
        },
    },
    {
        key: 'adoption',
        label: 'Adoption',
        weight: DEFAULT_COMPOSITE_WEIGHTS.adoption,
        weightLabel: '15%',
        tint: {
            cssVar: 'var(--color-accent)',
            dimVar: 'var(--color-accent-dim)',
            glowVar: 'var(--color-accent-glow)',
        },
    },
    {
        key: 'services',
        label: 'Services',
        weight: DEFAULT_COMPOSITE_WEIGHTS.services,
        weightLabel: '15%',
        tint: {
            cssVar: 'var(--color-success)',
            dimVar: 'var(--color-success-dim)',
            glowVar: 'rgba(52, 211, 153, 0.4)',
        },
    },
    {
        key: 'publisher',
        label: 'Publisher',
        weight: DEFAULT_COMPOSITE_WEIGHTS.publisher,
        weightLabel: '20%',
        tint: {
            cssVar: '#60a5fa',
            dimVar: 'rgba(96, 165, 250, 0.12)',
            glowVar: 'rgba(96, 165, 250, 0.35)',
        },
    },
    {
        key: 'compliance',
        label: 'Compliance',
        weight: DEFAULT_COMPOSITE_WEIGHTS.compliance,
        weightLabel: '10%',
        tint: {
            cssVar: 'var(--color-warning)',
            dimVar: 'var(--color-warning-dim)',
            glowVar: 'rgba(251, 191, 36, 0.4)',
        },
    },
];

const EMPTY: ScoreBreakdown = {
    reputation: 0,
    adoption: 0,
    services: 0,
    publisher: 0,
    compliance: 0,
};

function effectiveWeight(c: ComponentDef, qualityPresent: boolean): number {
    if (c.optional && !qualityPresent) return 0;
    return c.weight;
}

export function ScoreBreakdownPanel({
    breakdown,
    compositeScore,
    qualityPresent = true,
    variant = 'standalone',
}: ScoreBreakdownPanelProps) {
    const data = breakdown ?? EMPTY;
    const isPending = !breakdown;
    const isHero = variant === 'hero';

    const presentWeightSum = COMPONENTS.reduce(
        (sum, c) => sum + effectiveWeight(c, qualityPresent),
        0,
    );

    const sumContrib = computeCompositeFromBreakdown(data, qualityPresent);

    return (
        <div className={`relative overflow-hidden ${isHero ? 'card-glass p-5' : 'card p-5'}`}>
            <div
                className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full blur-3xl opacity-60"
                style={{ background: 'var(--color-primary-glow)' }}
                aria-hidden
            />

            <div className="relative">
                <div className="flex items-end justify-between mb-1">
                    <span
                        className="font-heading text-sm md:text-base font-semibold uppercase tracking-[0.22em] text-primary"
                        style={{ textShadow: '0 0 20px var(--color-primary-glow)' }}
                    >
                        Composite Trust
                    </span>
                    <span className="font-mono text-xs text-muted">/100</span>
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
                        style={{ width: `${clampScore(compositeScore)}%` }}
                    />
                </div>
            </div>

            <div className="relative mt-6 border-t border-border-subtle pt-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-heading text-3xs uppercase tracking-[0.28em] text-muted">
                        Score Composition
                    </span>
                    <div className="flex gap-4 font-heading text-3xs uppercase tracking-[0.22em] text-subtle">
                        <span className="w-10 text-right">Value</span>
                        <span className="w-12 text-right">Contrib</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {COMPONENTS.map(c => {
                        const raw = data[c.key] ?? 0;
                        const clamped = clampScore(raw);
                        const weight = effectiveWeight(c, qualityPresent);
                        const isAbsent = c.optional && !qualityPresent;
                        const effectiveShare = presentWeightSum > 0 ? weight / presentWeightSum : 0;
                        const contribution = isAbsent ? 0 : clamped * effectiveShare;

                        return (
                            <div key={c.key} className={isAbsent ? 'opacity-50' : undefined}>
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className="font-mono text-3xs font-semibold tabular-nums px-1.5 py-0.5 rounded"
                                            style={{
                                                background: c.tint.dimVar,
                                                color: c.tint.cssVar,
                                                border: `1px solid ${c.tint.cssVar}33`,
                                            }}
                                        >
                                            {isAbsent ? '—' : c.weightLabel}
                                        </span>
                                        <span className="text-text font-medium">{c.label}</span>
                                        {isAbsent && (
                                            <span className="text-3xs uppercase tracking-wider text-subtle">
                                                Unrated
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 font-mono tabular-nums">
                                        <span className="text-muted w-10 text-right">
                                            {isAbsent ? '—' : raw.toFixed(1)}
                                        </span>
                                        <span
                                            className="font-heading font-semibold w-12 text-right"
                                            style={{ color: c.tint.cssVar }}
                                        >
                                            {isAbsent ? '—' : `+${contribution.toFixed(1)}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="score-bar-wrap" style={{ height: '5px' }}>
                                    <div
                                        className="h-full rounded-[2px] transition-all duration-700"
                                        style={{
                                            width: `${isAbsent ? 0 : clamped}%`,
                                            background: c.tint.cssVar,
                                            boxShadow: `0 0 10px ${c.tint.glowVar}`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-5 pt-3 border-t border-dashed border-border-subtle flex items-center justify-between">
                    <span className="font-heading text-3xs uppercase tracking-[0.28em] text-muted">
                        Σ Total
                    </span>
                    <span className="font-heading font-bold text-primary text-base tabular-nums">
                        {sumContrib.toFixed(1)}
                        <span className="text-xs text-subtle ml-1">/100</span>
                    </span>
                </div>

                {!qualityPresent && (
                    <p className="mt-3 text-3xs leading-relaxed text-subtle">
                        Reputation is excluded from the composite until the agent receives scored service feedback.
                        Remaining weights are renormalized to 100%.
                    </p>
                )}

                {isPending && (
                    <div className="mt-3 flex items-center gap-2 text-3xs uppercase tracking-[0.2em] text-subtle">
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
