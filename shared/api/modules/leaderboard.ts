import { apiFetch } from '@/shared/api/core/http';
import type {
    LeaderboardAgent,
    LeaderboardQuery,
    LeaderboardStats,
    RisingStar,
    TagCount,
} from '@/shared/api/types';

function buildLeaderboardParams(q: LeaderboardQuery): URLSearchParams {
    const p = new URLSearchParams();
    if (q.chainIds?.length) p.set('chainId', q.chainIds.join(','));
    // Backend expects singular query keys (see handlers.LeaderboardHandler.List).
    if (q.skills?.length) p.set('skill', q.skills.join(','));
    if (q.domains?.length) p.set('domain', q.domains.join(','));
    if (q.services?.length) p.set('service', q.services.join(','));
    if (q.tags?.length) p.set('tag', q.tags.join(','));
    if (q.x402 !== undefined) p.set('x402', String(q.x402));
    if (q.hasOASF !== undefined) p.set('hasOASF', String(q.hasOASF));
    if (q.active !== undefined) p.set('active', String(q.active));
    if (q.minScore !== undefined) p.set('minScore', String(q.minScore));
    if (q.minTasks !== undefined) p.set('minTasks', String(q.minTasks));
    if (q.query) p.set('query', q.query);
    if (q.sort) p.set('sort', q.sort);
    if (q.page) p.set('page', String(q.page));
    if (q.limit) p.set('limit', String(q.limit));
    return p;
}

export const leaderboardApi = {
    leaderboard: (params: Record<string, string | number | boolean>) => {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== '') q.set(k, String(v));
        });
        return apiFetch<LeaderboardAgent[]>(`/leaderboard?${q}`);
    },

    leaderboardQuery: (q: LeaderboardQuery) =>
        apiFetch<LeaderboardAgent[]>(`/leaderboard?${buildLeaderboardParams(q)}`),

    newAgents: (chainIds: number[], limit = 8) =>
        apiFetch<LeaderboardAgent[]>(
            `/leaderboard?${buildLeaderboardParams({ chainIds, sort: 'recent', limit, page: 1 })}`,
        ),

    tags: (chainIds: number[], search = '', limit = 50) => {
        const p = new URLSearchParams();
        if (chainIds.length) p.set('chainId', chainIds.join(','));
        if (search) p.set('q', search);
        p.set('limit', String(limit));
        return apiFetch<TagCount[]>(`/leaderboard/tags?${p}`);
    },

    leaderboardSearch: (chainId: number, q: string) =>
        apiFetch<{ chainId: number; agentId: string; name: string; image: string; trustScore: number }[]>(
            `/leaderboard/search?chainId=${chainId}&q=${encodeURIComponent(q)}`,
        ),

    risingStars: (chainId: number, period = '24h') =>
        apiFetch<RisingStar[]>(`/leaderboard/rising-stars?chainId=${chainId}&period=${period}`),

    risingStarsMulti: (chainIds: number[], period = '24h', limit = 10) => {
        const p = new URLSearchParams();
        if (chainIds.length) p.set('chainId', chainIds.join(','));
        p.set('period', period);
        p.set('limit', String(limit));
        return apiFetch<RisingStar[]>(`/leaderboard/rising-stars?${p}`);
    },

    leaderboardStats: (chainId: number) =>
        apiFetch<LeaderboardStats>(`/leaderboard/stats?chainId=${chainId}`),

    leaderboardStatsMulti: (chainIds: number[]) => {
        const p = new URLSearchParams();
        if (chainIds.length) p.set('chainId', chainIds.join(','));
        return apiFetch<LeaderboardStats>(`/leaderboard/stats?${p}`);
    },
};
