import type { ScoreBreakdown } from '@/shared/api/response-types';

/** Matches BE scoring.DefaultCompositeWeights(). */
export const DEFAULT_COMPOSITE_WEIGHTS = {
    reputation: 0.4,
    adoption: 0.15,
    services: 0.15,
    publisher: 0.2,
    compliance: 0.1,
} as const;

type WeightedComponent = {
    score: number;
    weight: number;
    present: boolean;
};

/** Mirrors BE scoring.ComputeCompositeRenorm. */
export function computeCompositeRenorm(components: WeightedComponent[]): number {
    let weighted = 0;
    let totalWeight = 0;

    for (const c of components) {
        if (!c.present || c.weight <= 0) continue;
        const s = Math.max(0, Math.min(100, c.score));
        weighted += c.weight * s;
        totalWeight += c.weight;
    }

    if (totalWeight <= 0) return 0;
    return Math.max(0, Math.min(100, weighted / totalWeight));
}

/** Mirrors BE scoring.ComputeCompositeFromStats for profile breakdown display. */
export function computeCompositeFromBreakdown(
    breakdown: ScoreBreakdown,
    qualityPresent: boolean,
    weights = DEFAULT_COMPOSITE_WEIGHTS,
): number {
    return computeCompositeRenorm([
        { score: breakdown.reputation, weight: weights.reputation, present: qualityPresent },
        { score: breakdown.adoption, weight: weights.adoption, present: true },
        { score: breakdown.services, weight: weights.services, present: true },
        { score: breakdown.publisher, weight: weights.publisher, present: true },
        { score: breakdown.compliance, weight: weights.compliance, present: true },
    ]);
}

export function clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
}
