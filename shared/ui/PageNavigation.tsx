"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";

/** e.g. 1,2,3 … 50 … 15941,15942 — deduped, sorted, ellipses only between gaps > 1 */
export function buildPaginationItems(totalPages: number, current: number): Array<number | "ellipsis"> {
    if (totalPages < 1) return [1];
    if (totalPages <= 9) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set<number>();
    const add = (n: number) => {
        if (n >= 1 && n <= totalPages) set.add(n);
    };
    add(1);
    add(2);
    add(3);
    add(current);
    add(totalPages - 1);
    add(totalPages);
    const sorted = [...set].sort((a, b) => a - b);
    const out: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) {
            out.push("ellipsis");
        }
        out.push(sorted[i]!);
    }
    return out;
}

export interface PageNavigationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
    /** Merged with layout shell (e.g. margins, top border). */
    className?: string;
}

/**
 * Shared Prev / numeric pages with ellipses / Next + “Page [input] / total”.
 */
export default function PageNavigation({ page, totalPages, onPageChange, loading, className = "" }: PageNavigationProps) {
    const [draft, setDraft] = useState(String(page));

    useEffect(() => {
        setDraft(String(page));
    }, [page]);

    const commitDraft = useCallback(() => {
        const n = parseInt(draft.replace(/\D/g, ""), 10);
        if (Number.isNaN(n)) {
            setDraft(String(page));
            return;
        }
        const clamped = Math.min(totalPages, Math.max(1, n));
        onPageChange(clamped);
        setDraft(String(clamped));
    }, [draft, onPageChange, page, totalPages]);

    const items = buildPaginationItems(totalPages, page);
    const singlePage = totalPages <= 1;

    const rootClass = ["shrink-0 min-h-[3.25rem] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4", className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={rootClass}>
            <div className="flex flex-wrap items-center gap-1 text-sm justify-center lg:justify-start">
                <Button
                    type="button"
                    variant="outline"
                    className="border-border text-muted hover:text-white disabled:opacity-30"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1 || loading || singlePage}
                >
                    Prev
                </Button>
                {totalPages > 1 &&
                    items.map((item, idx) =>
                        item === "ellipsis" ? (
                            <span key={`e-${idx}`} className="px-1.5 py-1.5 text-muted select-none" aria-hidden>
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                disabled={loading}
                                className={`min-w-[2rem] px-1.5 py-1.5 rounded-md transition-all tabular-nums disabled:opacity-40 disabled:pointer-events-none ${
                                    page === item ? "bg-primary text-black font-bold" : "text-muted hover:text-white hover:bg-white/5"
                                }`}
                                onClick={() => onPageChange(item)}
                                aria-current={page === item ? "page" : undefined}
                            >
                                {item}
                            </button>
                        )
                    )}
                <Button
                    type="button"
                    variant="outline"
                    className="border-border text-muted hover:text-white disabled:opacity-30"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || loading || singlePage}
                >
                    Next
                </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-end gap-2 text-sm text-subtle shrink-0">
                <span className="text-muted font-medium">Page</span>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Go to page"
                    disabled={loading || singlePage}
                    className="min-w-[3.25rem] max-w-[7rem] w-20 rounded-md border border-border bg-black/40 px-2 py-1.5 text-center text-white tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 disabled:opacity-40"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            commitDraft();
                        }
                    }}
                />
                <span className="font-medium tabular-nums text-muted">/ {totalPages.toLocaleString()}</span>
            </div>
        </div>
    );
}
