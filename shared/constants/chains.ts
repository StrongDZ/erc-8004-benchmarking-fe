export interface ChainDisplayMeta {
    name: string;
    shortName: string;
    nativeCurrency: string;
    blockExplorer: string;
    iconUrl?: string;
    brandColor?: string;
}

export const CHAIN_DISPLAY_META: Record<number, ChainDisplayMeta> = {
    1: {
        name: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: 'ETH',
        blockExplorer: 'https://etherscan.io',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
        brandColor: '#627EEA',
    },
    56: {
        name: 'BNB Smart Chain',
        shortName: 'bsc',
        nativeCurrency: 'BNB',
        blockExplorer: 'https://bscscan.com',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/info/logo.png',
        brandColor: '#F0B90B',
    },
    143: {
        name: 'Monad',
        shortName: 'monad',
        nativeCurrency: 'MON',
        blockExplorer: 'https://monadvision.com',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/monad/info/logo.png',
        brandColor: '#836EF9',
    },
    8453: {
        name: 'Base',
        shortName: 'base',
        nativeCurrency: 'ETH',
        blockExplorer: 'https://basescan.org',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png',
        brandColor: '#0052FF',
    },
    42161: {
        name: 'Arbitrum One',
        shortName: 'arb1',
        nativeCurrency: 'ETH',
        blockExplorer: 'https://arbiscan.io',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
        brandColor: '#28A0F0',
    },
    42220: {
        name: 'Celo',
        shortName: 'celo',
        nativeCurrency: 'CELO',
        blockExplorer: 'https://celoscan.io',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png',
        brandColor: '#35D07F',
    },
    43114: {
        name: 'Avalanche C-Chain',
        shortName: 'avax',
        nativeCurrency: 'AVAX',
        blockExplorer: 'https://snowtrace.io',
        iconUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
        brandColor: '#E84142',
    },
};
