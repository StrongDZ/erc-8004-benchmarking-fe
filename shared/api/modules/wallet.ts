import { apiFetch } from '@/shared/api/core/http';
import type { FeedbackAgent, LeaderboardAgent, WalletENSRow, WalletFeedback, WalletProfile } from '@/shared/api/types';

export const walletApi = {
    ownedAgents: (address: string) =>
        apiFetch<LeaderboardAgent[]>(
            `/leaderboard?owner=${encodeURIComponent(address)}&limit=100&sort=score_desc`,
        ),

    feedbackGiven: (address: string, page = 1, limit = 20) =>
        apiFetch<WalletFeedback[]>(
            `/wallet/${encodeURIComponent(address)}/feedbacks?page=${page}&limit=${limit}`,
        ),

    feedbackAgents: (address: string, page = 1, limit = 20) =>
        apiFetch<FeedbackAgent[]>(
            `/wallet/${encodeURIComponent(address)}/feedback-agents?page=${page}&limit=${limit}`,
        ),

    walletProfile: (address: string, chainId?: number) => {
        const q = chainId ? `?chainId=${chainId}` : '';
        return apiFetch<WalletProfile>(`/wallet/${encodeURIComponent(address)}${q}`);
    },

    walletsENS: (addresses: string[]) => {
        const q = addresses.map((a) => `addresses=${encodeURIComponent(a)}`).join('&');
        return apiFetch<WalletENSRow[]>(`/wallets/ens?${q}`);
    },
};
