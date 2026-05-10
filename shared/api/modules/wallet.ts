import { apiFetch } from '@/shared/api/core/http';
import type { LeaderboardAgent, WalletFeedback } from '@/shared/api/types';

export const walletApi = {
    ownedAgents: (address: string) =>
        apiFetch<LeaderboardAgent[]>(
            `/leaderboard?owner=${encodeURIComponent(address)}&limit=100&sort=score_desc`,
        ),

    feedbackGiven: (address: string, page = 1, limit = 20) =>
        apiFetch<WalletFeedback[]>(
            `/wallet/${encodeURIComponent(address)}/feedbacks?page=${page}&limit=${limit}`,
        ),
};
