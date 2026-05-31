export const DEFAULT_API_BASE_URL = 'http://localhost:8080/api/v1';
export const DEFAULT_WS_URL = 'ws://localhost:8080/api/v1/ws';
export const DEFAULT_ADMIN_API_KEY = '';
export const DEFAULT_CHAIN_ID = 8453;

export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const FALLBACK_AVATAR_DATA_URI =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%231E293B"/%3E%3C/svg%3E';

export const INDEXER_STATUS_POLL_INTERVAL_MS = 30_000;

export const DEFAULT_FEEDBACK_PAGE_SIZE = 10;
export const RISING_STAR_PERIODS = ['24h', '7d', '30d'] as const;

export const SOCKET_RECONNECT_INITIAL_DELAY_MS = 1_000;
export const SOCKET_RECONNECT_MAX_DELAY_MS = 15_000;
export const SOCKET_PING_INTERVAL_MS = 25_000;
