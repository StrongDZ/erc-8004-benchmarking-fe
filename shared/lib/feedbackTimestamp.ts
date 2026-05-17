/**
 * Resolves feedback event time to epoch milliseconds.
 * Supports RFC3339 `timestamp`, numeric unix seconds/ms strings, numeric `timestamp`,
 * and optional `timestampUnix` from the API (seconds).
 */
export function feedbackEventTimeMs(
    ts: string | number | undefined,
    timestampUnix?: number | null,
): number | null {
    if (timestampUnix != null && timestampUnix > 0) {
        return timestampUnix < 1e12 ? timestampUnix * 1000 : timestampUnix;
    }
    if (ts === undefined || ts === '') return null;
    if (typeof ts === 'number') {
        if (Number.isNaN(ts)) return null;
        return ts < 1e12 ? ts * 1000 : ts;
    }
    const trimmed = ts.trim();
    if (/^\d+$/.test(trimmed)) {
        const n = parseInt(trimmed, 10);
        if (Number.isNaN(n)) return null;
        return n < 1e12 ? n * 1000 : n;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
}

export function formatFeedbackTableDate(
    ts: string | number | undefined,
    timestampUnix?: number | null,
): string {
    const ms = feedbackEventTimeMs(ts, timestampUnix);
    if (ms === null) return '—';
    return new Date(ms).toLocaleDateString();
}
