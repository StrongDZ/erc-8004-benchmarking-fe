'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

export interface FloatingPanelRect {
    top: number;
    left: number;
    width: number;
}

/** Measure anchor position for a fixed panel portaled to document.body. */
export function useFloatingPanel(open: boolean, anchorRef: RefObject<HTMLElement | null>, gap = 4) {
    const [rect, setRect] = useState<FloatingPanelRect | null>(null);

    useLayoutEffect(() => {
        if (!open || !anchorRef.current) {
            setRect(null);
            return;
        }

        const update = () => {
            const el = anchorRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setRect({ top: r.bottom + gap, left: r.left, width: r.width });
        };

        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [open, anchorRef, gap]);

    return rect;
}
