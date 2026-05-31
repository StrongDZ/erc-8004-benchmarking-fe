import { apiFetch } from '@/shared/api/core/http';
import type { LeaderboardAgent, WalletFeedback, WalletProfile } from '@/shared/api/types';

export const walletApi = {
    ownedAgents: (address: string) =>
        apiFetch<LeaderboardAgent[]>(
            `/leaderboard?owner=${encodeURIComponent(address)}&limit=100&sort=score_desc`,
        ),

    feedbackGiven: (address: string, page = 1, limit = 20) =>
        apiFetch<WalletFeedback[]>(
            `/wallet/${encodeURIComponent(address)}/feedbacks?page=${page}&limit=${limit}`,
        ),

    walletProfile: (address: string, chainId?: number) => {
        const q = chainId ? `?chainId=${chainId}` : '';
        return apiFetch<WalletProfile>(`/wallet/${encodeURIComponent(address)}${q}`);
    },
};
