import { env } from '@/shared/config/env';
import type { ApiResponse } from '@/shared/api/types';

const API_BASE = env.apiBaseUrl;
const ADMIN_API_KEY = env.adminApiKey;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    // Env key is applied first so caller-supplied headers can override it.
    if (path.startsWith('/admin/') && ADMIN_API_KEY) {
        headers['X-API-Key'] = ADMIN_API_KEY;
    }
    if (init?.headers) {
        const extraHeaders = new Headers(init.headers);
        extraHeaders.forEach((value, key) => {
            headers[key] = value;
        });
    }
    // Spread init first so the merged headers (Content-Type + admin key + caller
    // overrides, built above) win — otherwise init.headers would re-clobber them.
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
    });
    const json: ApiResponse<T> = await res.json();
    return json;
}
