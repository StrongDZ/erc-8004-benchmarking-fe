import { FALLBACK_AVATAR_DATA_URI, IPFS_GATEWAY } from '@/shared/constants/app';

export function resolveIPFS(uri: string | undefined | null): string {
    if (!uri) return FALLBACK_AVATAR_DATA_URI;
    if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice(7);
    return uri;
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
