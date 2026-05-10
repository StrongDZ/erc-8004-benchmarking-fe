import {
    DEFAULT_ADMIN_API_KEY,
    DEFAULT_API_BASE_URL,
} from '../constants/app';

function readEnv(value: string | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : fallback;
}

export const env = {
    apiBaseUrl: readEnv(process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_BASE_URL),
    wsUrlOverride: process.env.NEXT_PUBLIC_WS_URL?.trim() || '',
    adminApiKey: readEnv(process.env.NEXT_PUBLIC_ADMIN_API_KEY, DEFAULT_ADMIN_API_KEY),
} as const;
