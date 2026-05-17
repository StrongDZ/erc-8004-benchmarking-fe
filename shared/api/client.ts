import { adminApi } from '@/shared/api/modules/admin';
import { agentsApi } from '@/shared/api/modules/agents';
import { chainsApi } from '@/shared/api/modules/chains';
import { leaderboardApi } from '@/shared/api/modules/leaderboard';
import { oasfApi } from '@/shared/api/modules/oasf';
import { offchainApi } from '@/shared/api/modules/offchain';
import { walletApi } from '@/shared/api/modules/wallet';
import {
    explorerAddressUrl as toExplorerAddressUrl,
    explorerTxUrl as toExplorerTxUrl,
    enrichChain,
} from '@/shared/api/utils/chains';
import { formatPercent, formatScore, resolveIPFS, truncateAddress } from '@/shared/api/utils/format';

export * from '@/shared/api/types';
export { enrichChain, formatPercent, formatScore, resolveIPFS, truncateAddress };

export function explorerUrl(chainId: number, txHash: string): string {
    return toExplorerTxUrl(chainId, txHash);
}

export function explorerAddressUrl(chainId: number, address: string): string {
    return toExplorerAddressUrl(chainId, address);
}

export const api = {
    ...chainsApi,
    ...leaderboardApi,
    ...agentsApi,
    ...oasfApi,
    ...offchainApi,
    ...adminApi,
    ...walletApi,
};
