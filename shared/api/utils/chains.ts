import { CHAIN_DISPLAY_META, type ChainDisplayMeta } from '@/shared/constants/chains';
import type { Chain, ChainCore } from '@/shared/api/types';

export function chainDisplayMeta(chainId: number): ChainDisplayMeta {
    return CHAIN_DISPLAY_META[chainId] ?? {
        name: `Chain ${chainId}`,
        shortName: `chain-${chainId}`,
        nativeCurrency: '',
        blockExplorer: '',
    };
}

export function explorerTxUrl(chainId: number, txHash: string): string {
    const base = chainDisplayMeta(chainId).blockExplorer;
    return base ? `${base}/tx/${txHash}` : '';
}

export function explorerAddressUrl(chainId: number, address: string): string {
    const base = chainDisplayMeta(chainId).blockExplorer;
    return base ? `${base}/address/${address}` : '';
}

export function enrichChain(core: ChainCore): Chain {
    const meta = chainDisplayMeta(core.chainId);
    return {
        chainId: core.chainId,
        agentCount: core.agentCount,
        name: meta.name,
        shortName: meta.shortName,
        nativeCurrency: meta.nativeCurrency,
        blockExplorer: meta.blockExplorer,
        iconUrl: meta.iconUrl,
        brandColor: meta.brandColor,
    };
}
