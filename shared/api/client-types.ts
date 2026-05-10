import type { ChainCore, IndexerChainStatus } from '@/shared/api/response-types';

export interface Chain extends ChainCore {
    name: string;
    shortName: string;
    nativeCurrency: string;
    blockExplorer: string;
    iconUrl?: string;
    brandColor?: string;
}

// FE-rendered shape after enriching API data with display metadata.
export interface IndexerChainStatusView extends IndexerChainStatus {
    chainName: string;
    iconUrl?: string;
    brandColor?: string;
}
