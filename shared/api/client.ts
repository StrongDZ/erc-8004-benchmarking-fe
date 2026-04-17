const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/* ── Response envelope ─────────────────────────────────────────────── */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: { page: number; limit: number; total: number };
    error?: { code: string; message: string };
    requestId?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
export function resolveIPFS(uri: string | undefined | null): string {
    if (!uri) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%231E293B"/%3E%3C/svg%3E';
    if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice(7);
    return uri;
}

export function explorerUrl(chainId: number, txHash: string): string {
    const explorers: Record<number, string> = {
        8453: 'https://basescan.org',
        42161: 'https://arbiscan.io',
    };
    const base = explorers[chainId] ?? 'https://etherscan.io';
    return `${base}/tx/${txHash}`;
}

export function explorerAddressUrl(chainId: number, address: string): string {
    const explorers: Record<number, string> = {
        8453: 'https://basescan.org',
        42161: 'https://arbiscan.io',
    };
    const base = explorers[chainId] ?? 'https://etherscan.io';
    return `${base}/address/${address}`;
}

export function truncateAddress(addr: string, chars = 6): string {
    if (!addr) return '';
    return `${addr.slice(0, chars)}...${addr.slice(-4)}`;
}

export function formatScore(s: number): string {
    return s.toFixed(1);
}

export function formatPercent(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

/* ── Fetch wrapper ──────────────────────────────────────────────────── */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    const json: ApiResponse<T> = await res.json();
    return json;
}

/* ── Types ──────────────────────────────────────────────────────────── */
export interface Chain {
    chainId: number;
    name: string;
    shortName: string;
    nativeCurrency: string;
    blockExplorer: string;
    agentCount: number;
}

export interface LeaderboardAgent {
    rank: number;
    chainId: number;
    agentId: string;
    name: string;
    image: string;
    owner: string;
    trustScore: number;
    accumulatedScore: number;
    scoreUpdateAt: number;
    consecutiveFails: number;
    totalTasks: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    active: boolean;
    x402Support: boolean;
    hasOASF: boolean;
    domains: string[];
    oasfSkills: string[];
    oasfDomains: string[];
    services?: AgentService[];
    tags?: string[];
    createdAt?: number; // unix seconds (from API)
}

export interface AgentService {
    name: string;
    endpoint?: string;
    version?: string;
    skills?: string[];
    domains?: string[];
}

export interface LeaderboardStats {
    chainId: number;
    chainIds?: number[];
    totalAgents: number;
    activeAgents: number;
    totalFeedbacks: number;
    avgTrustScore: number;
    medianTrustScore: number;
    top10ScoreAvg: number;
    lastBlockIndexed: number;
    lastIndexedAt: string;
}

export interface TagCount {
    tag: string;
    count: number;
}

export interface RisingStar {
    chainId: number;
    agentId: string;
    name: string;
    scoreNow: number;
    scoreBefore: number;
    delta: number;
    velocity: number;
    period: string;
}

export interface AgentProfile {
    chainId: number;
    agentId: string;
    owner: string;
    agentURI: string;
    name: string;
    description: string;
    image: string;
    active: boolean;
    x402Support: boolean;
    supportedTrust: string[];
    domains: string[];
    hasOASF: boolean;
    oasfSkills: string[];
    oasfDomains: string[];
    scoring: {
        trustScore: number;
        accumulatedScore: number;
        scoreUpdateAt: number;
        consecutiveFails: number;
        penalty: number;
        totalTasks: number;
        totalPassed: number;
        totalFailed: number;
        successRate: number;
        classDistribution: Record<string, number>;
    };
    createdAt: string;
    offchainMetadata?: Record<string, string>;
}

export interface ScorePoint {
    timestamp: string;
    score: number;
    type: 'event' | 'decay';
    txHash?: string;
}

export interface RadarData {
    successRate: number;
    taskVolume: number;
    avgDifficulty: number;
    scoreVelocity: number;
    domainDepth: number;
    consistency: number;
}

export interface HeatmapDay {
    date: string;
    count: number;
    passed: number;
    failed: number;
}

export interface Feedback {
    _id: string;
    feedbackIndex: number;
    clientAddress: string;
    value: string;
    vi: number;
    wi: number;
    priceUSDC: number;
    tag1: string;
    tag2: string;
    txHash: string;
    blockNumber: number;
    timestamp: string;
    revokeTxHash: string | null;
    feedbackURI?: string;
    classification?: {
        category: string;
        confidence: number;
        source: string;
        normalizedTag: string;
    };
    responses?: Array<{ responder: string; responseURI: string; txHash: string }>;
}

export interface Penalty {
    feedbackIndex: number;
    clientAddress: string;
    timestamp: string;
    vi: number;
    wi: number;
    penaltyApplied: number;
    reason: 'fail' | 'revoked';
    txHash: string;
    revokeTxHash: string | null;
}

export interface IdentityEvent {
    eventName: string;
    agentURI: string;
    owner: string;
    blockNumber: number;
    txHash: string;
    timestamp: string;
}

export interface OASFFacet {
    key: string;
    // BE returns `name` (not `label`) for facet nodes
    name?: string;
    label?: string;
    count: number;
    parentKey?: string;
    children?: OASFFacet[];
}

export interface OASFFacetTree {
    allSkillsCount: number;
    allDomainsCount: number;
    skillNodes: OASFFacet[];
    domainNodes: OASFFacet[];
}

export interface ProofData {
    chainId: number;
    txHash: string;
    blockNumber: number;
    blockExplorerURL: string;
    eventName: string;
    contractType: string;
    args: Record<string, unknown>;
    feedbackURI?: string;
    responseURIs?: string[];
}

/* ── Filter shape (multi-select) ────────────────────────────────────── */
// All array fields are serialized as CSV query params; the API parses comma-separated values.
export interface LeaderboardQuery {
    chainIds?: number[];
    skills?: string[];
    domains?: string[];
    services?: string[];
    tags?: string[];
    x402?: boolean;
    hasOASF?: boolean;
    active?: boolean;
    minScore?: number;
    minTasks?: number;
    query?: string;
    sort?: 'score_desc' | 'score_asc' | 'tasks_desc' | 'recent';
    page?: number;
    limit?: number;
}

function buildLeaderboardParams(q: LeaderboardQuery): URLSearchParams {
    const p = new URLSearchParams();
    if (q.chainIds?.length) p.set('chainId', q.chainIds.join(','));
    if (q.skills?.length) p.set('skills', q.skills.join(','));
    if (q.domains?.length) p.set('domains', q.domains.join(','));
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

/* ── API calls ──────────────────────────────────────────────────────── */
export const api = {
    chains: () => apiFetch<Chain[]>('/chains'),

    // Legacy signature kept for backward compatibility with existing callers.
    leaderboard: (params: Record<string, string | number | boolean>) => {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
        return apiFetch<LeaderboardAgent[]>(`/leaderboard?${q}`);
    },

    // Preferred entry point for the new multi-select dashboard filter.
    leaderboardQuery: (q: LeaderboardQuery) =>
        apiFetch<LeaderboardAgent[]>(`/leaderboard?${buildLeaderboardParams(q)}`),

    // Convenience: latest N agents (sorted by createdAt desc).
    newAgents: (chainIds: number[], limit = 8) =>
        apiFetch<LeaderboardAgent[]>(
            `/leaderboard?${buildLeaderboardParams({ chainIds, sort: 'recent', limit, page: 1 })}`,
        ),

    // Top tags across the selected chain scope; suitable for filter autocomplete.
    tags: (chainIds: number[], search = '', limit = 50) => {
        const p = new URLSearchParams();
        if (chainIds.length) p.set('chainId', chainIds.join(','));
        if (search) p.set('q', search);
        p.set('limit', String(limit));
        return apiFetch<TagCount[]>(`/leaderboard/tags?${p}`);
    },

    leaderboardSearch: (chainId: number, q: string) =>
        apiFetch<{ chainId: number; agentId: string; name: string; image: string; trustScore: number }[]>(
            `/leaderboard/search?chainId=${chainId}&q=${encodeURIComponent(q)}`
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

    // Multi-chain stats; empty array = all chains.
    leaderboardStatsMulti: (chainIds: number[]) => {
        const p = new URLSearchParams();
        if (chainIds.length) p.set('chainId', chainIds.join(','));
        return apiFetch<LeaderboardStats>(`/leaderboard/stats?${p}`);
    },

    agentProfile: (chainId: number, agentId: string) =>
        apiFetch<AgentProfile>(`/agents/${chainId}/${agentId}`),

    scoreHistory: (chainId: number, agentId: string, resolution = '1d') =>
        apiFetch<{ points: ScorePoint[] }>(`/agents/${chainId}/${agentId}/score-history?resolution=${resolution}`),

    radar: (chainId: number, agentId: string) =>
        apiFetch<RadarData>(`/agents/${chainId}/${agentId}/radar`),

    activityHeatmap: (chainId: number, agentId: string) =>
        apiFetch<HeatmapDay[]>(`/agents/${chainId}/${agentId}/activity-heatmap`),

    feedbacks: (chainId: number, agentId: string, params: Record<string, string | number> = {}) => {
        const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
        return apiFetch<Feedback[]>(`/agents/${chainId}/${agentId}/feedbacks?${q}`);
    },

    feedbackDetail: (chainId: number, agentId: string, feedbackId: string) =>
        apiFetch<Feedback & { offchainContent?: unknown; offchainParsed?: unknown }>(
            `/agents/${chainId}/${agentId}/feedbacks/${feedbackId}`
        ),

    penalties: (chainId: number, agentId: string, page = 1) =>
        apiFetch<Penalty[]>(`/agents/${chainId}/${agentId}/penalties?page=${page}&limit=50`),

    identityHistory: (chainId: number, agentId: string) =>
        apiFetch<IdentityEvent[]>(`/agents/${chainId}/${agentId}/identity-history`),

    relatedAgents: (chainId: number, agentId: string) =>
        apiFetch<LeaderboardAgent[]>(`/agents/${chainId}/${agentId}/related?limit=8`),

    oasfFacets: (chainId: number) =>
        apiFetch<OASFFacetTree>(`/oasf/facets?chainId=${chainId}`),

    proof: (chainId: number, agentId: string, txHash: string) =>
        apiFetch<ProofData>(`/agents/${chainId}/${agentId}/proof/${txHash}`),

    indexerStatus: () =>
        apiFetch<unknown>('/admin/indexer-status'),
};
