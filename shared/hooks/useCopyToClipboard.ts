'use client';
import { useCallback, useEffect, useState } from 'react';

export function useCopyToClipboard(resetDelay = 1200): [boolean, (value: string) => void] {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), resetDelay);
        return () => clearTimeout(timer);
    }, [copied, resetDelay]);

    const copy = useCallback(async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    }, []);

    return [copied, copy];
}
