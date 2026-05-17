'use client';
import { ScoreBreakdown } from '@/shared/api/response-types';

interface ScoreBreakdownPanelProps {
    breakdown: ScoreBreakdown;
    compositeScore: number;
}

const COMPONENTS = [
    { key: 'reputation' as const, label: 'Reputation', weight: '50%' },
    { key: 'services' as const, label: 'Services', weight: '20%' },
    { key: 'publisher' as const, label: 'Publisher', weight: '20%' },
    { key: 'compliance' as const, label: 'Compliance', weight: '10%' },
];

function barColor(value: number): string {
    if (value >= 70) return 'var(--color-success)';
    if (value >= 40) return 'var(--color-warning)';
    return 'var(--color-danger)';
}

export function ScoreBreakdownPanel({ breakdown, compositeScore }: ScoreBreakdownPanelProps) {
    return (
        <div className="card p-5">
            <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-heading text-lg text-white">Trust Score Breakdown</h3>
                <div className="font-heading text-2xl text-primary leading-none">
                    {compositeScore.toFixed(1)}<span className="text-xs text-muted ml-1">/100</span>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {COMPONENTS.map(c => {
                    const value = breakdown[c.key];
                    const clamped = Math.max(0, Math.min(100, value));
                    return (
                        <div key={c.key}>
                            <div className="flex items-baseline justify-between text-xs mb-1">
                                <span className="text-muted">
                                    {c.label}{' '}
                                    <span className="text-subtle">· {c.weight}</span>
                                </span>
                                <span className="font-mono tabular-nums text-white">{value.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${clamped}%`,
                                        backgroundColor: barColor(value),
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
