import { apiFetch } from '@/shared/api/core/http';
import type {
    AgentOverview,
    AgentProfile,
    Feedback,
    HeatmapDay,
    IdentityEvent,
    LeaderboardAgent,
    Penalty,
    ProofData,
    RadarData,
    ReputationScorePoint,
} from '@/shared/api/types';

export const agentsApi = {
    agentProfile: (chainId: number, agentId: string) =>
        apiFetch<AgentProfile>(`/agents/${chainId}/${agentId}`),

    agentOverview: (chainId: number, agentId: string) =>
        apiFetch<AgentOverview>(`/agents/${chainId}/${agentId}/overview`),

    reputationScoreHistory: (chainId: number, agentId: string) =>
        apiFetch<{ points: ReputationScorePoint[] }>(`/agents/${chainId}/${agentId}/reputation-score-history`),

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
            `/agents/${chainId}/${agentId}/feedbacks/${feedbackId}`,
        ),

    penalties: (chainId: number, agentId: string, page = 1) =>
        apiFetch<Penalty[]>(`/agents/${chainId}/${agentId}/penalties?page=${page}&limit=50`),

    identityHistory: (chainId: number, agentId: string) =>
        apiFetch<IdentityEvent[]>(`/agents/${chainId}/${agentId}/identity-history`),

    relatedAgents: (chainId: number, agentId: string) =>
        apiFetch<LeaderboardAgent[]>(`/agents/${chainId}/${agentId}/related?limit=8`),

    proof: (chainId: number, agentId: string, txHash: string) =>
        apiFetch<ProofData>(`/agents/${chainId}/${agentId}/proof/${txHash}`),
};
