import { apiFetch } from '@/shared/api/core/http';
import type { IndexerStatusResponse } from '@/shared/api/types';

export interface RecomputeResult {
    requestId: string;
    status: string;
}

export interface SimulatorResult {
    agentId: string;
    count: number;
    requestId: string;
    status: string;
}

export const adminApi = {
    indexerStatus: () => apiFetch<IndexerStatusResponse>('/admin/indexer-status'),

    triggerRecompute: (chainId?: number, apiKey?: string) =>
        apiFetch<RecomputeResult>('/admin/scoring/recompute', {
            method: 'POST',
            body: JSON.stringify({ chainId: chainId ?? 0 }),
            ...(apiKey ? { headers: { 'X-API-Key': apiKey } } : {}),
        }),

    startSimulator: (agentId?: string, count?: number, apiKey?: string) =>
        apiFetch<SimulatorResult>('/admin/simulator/start', {
            method: 'POST',
            body: JSON.stringify({ agentId: agentId ?? '', count: count ?? 10 }),
            ...(apiKey ? { headers: { 'X-API-Key': apiKey } } : {}),
        }),
};
