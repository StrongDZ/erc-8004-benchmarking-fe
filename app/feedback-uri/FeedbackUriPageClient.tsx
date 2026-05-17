'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy } from 'lucide-react';
import { api, resolveIPFS } from '@/shared/api/client';
import type { OffchainByUriData } from '@/shared/api/types';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function offchainStatusLabel(status: number | undefined): string {
  if (status === undefined) return '—';
  if (status === -1) return 'Fetch failed';
  if (status === 1) return 'Fetched (non-JSON)';
  if (status === 5) return 'Fetched (JSON)';
  return `Status ${status}`;
}

function formatParsedJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function FeedbackUriPageClient() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [offchain, setOffchain] = useState<OffchainByUriData | null>(null);
  const [offchainLoading, setOffchainLoading] = useState(false);
  const [offchainError, setOffchainError] = useState<string | null>(null);

  const raw = useMemo(() => {
    const q = searchParams.get('uri');
    return safeDecodeURIComponent(q ?? '').trim();
  }, [searchParams]);

  const resolved = useMemo(() => {
    if (!raw) return '';
    return raw.startsWith('ipfs://') ? resolveIPFS(raw) : raw;
  }, [raw]);

  const resolvedNavigable = /^https?:\/\//i.test(resolved);

  useEffect(() => {
    if (!raw) {
      setOffchain(null);
      setOffchainError(null);
      setOffchainLoading(false);
      return;
    }
    let cancelled = false;
    setOffchainLoading(true);
    setOffchainError(null);
    setOffchain(null);
    void api.offchainByUri(raw).then((r) => {
      if (cancelled) return;
      setOffchainLoading(false);
      if (!r.success) {
        setOffchainError(r.error?.message ?? 'Request failed');
        return;
      }
      setOffchain(r.data ?? null);
    }).catch(() => {
      if (cancelled) return;
      setOffchainLoading(false);
      setOffchainError('Request failed');
    });
    return () => {
      cancelled = true;
    };
  }, [raw]);

  async function copyRaw() {
    if (!raw || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!raw) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card p-6 text-center text-muted text-sm">
          No feedback URI provided. Add a <code className="font-mono text-xs">uri</code> query parameter.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card p-6 space-y-6">
        <div>
          <h1 className="font-heading text-xl text-white mb-1">Feedback URI</h1>
          <p className="text-sm text-muted">Original URI and gateway-resolved URL for inspection.</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">Raw URI</h2>
          <pre className="rounded-lg border border-border bg-black/30 p-3 text-xs text-muted font-mono whitespace-pre-wrap break-all">{raw}</pre>
          <button
            type="button"
            onClick={() => void copyRaw()}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? 'Copied' : 'Copy raw URI'}
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">Resolved URL</h2>
          <pre className="rounded-lg border border-border bg-black/30 p-3 text-xs text-muted font-mono whitespace-pre-wrap break-all">{resolved || '—'}</pre>
          {!resolvedNavigable && resolved ? (
            <p className="text-xs text-warning">This value may not open directly in a browser (not an http(s) URL).</p>
          ) : null}
        </div>

        {resolvedNavigable ? (
          <div>
            <LinkOutbound href={resolved} external className="inline-flex items-center rounded-md border border-accent/40 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
              Open in new tab
            </LinkOutbound>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-border pt-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">Off-chain cache</h2>
            <p className="text-sm text-muted mt-1">
              Parsed payload from the indexer <code className="font-mono text-xs text-muted">offchain_data</code> collection (when this URI was fetched).
            </p>
          </div>

          {offchainLoading ? (
            <p className="text-sm text-muted">Loading off-chain snapshot…</p>
          ) : offchainError ? (
            <p className="text-sm text-danger">{offchainError}</p>
          ) : offchain && !offchain.found ? (
            <p className="text-sm text-muted">No row in <code className="font-mono text-xs">offchain_data</code> for this URI yet (not fetched or different canonical string).</p>
          ) : offchain && offchain.found ? (
            <div className="space-y-3">
              <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="flex flex-col gap-0.5 rounded-md border border-border bg-black/20 px-3 py-2">
                  <dt className="text-subtle uppercase tracking-wide">Status</dt>
                  <dd className="font-medium text-white">{offchainStatusLabel(offchain.status)}</dd>
                </div>
                {offchain.contentSize !== undefined && offchain.contentSize > 0 ? (
                  <div className="flex flex-col gap-0.5 rounded-md border border-border bg-black/20 px-3 py-2">
                    <dt className="text-subtle uppercase tracking-wide">Content size</dt>
                    <dd className="font-mono text-muted">{offchain.contentSize} bytes</dd>
                  </div>
                ) : null}
                {offchain.sourceType ? (
                  <div className="flex flex-col gap-0.5 rounded-md border border-border bg-black/20 px-3 py-2">
                    <dt className="text-subtle uppercase tracking-wide">Source</dt>
                    <dd className="font-mono text-muted">{offchain.sourceType}</dd>
                  </div>
                ) : null}
                {offchain.eventType ? (
                  <div className="flex flex-col gap-0.5 rounded-md border border-border bg-black/20 px-3 py-2">
                    <dt className="text-subtle uppercase tracking-wide">Event</dt>
                    <dd className="font-mono text-muted">{offchain.eventType}</dd>
                  </div>
                ) : null}
                {offchain.contractType ? (
                  <div className="flex flex-col gap-0.5 rounded-md border border-border bg-black/20 px-3 py-2">
                    <dt className="text-subtle uppercase tracking-wide">Contract</dt>
                    <dd className="font-mono text-muted">{offchain.contractType}</dd>
                  </div>
                ) : null}
              </dl>

              {offchain.fetchError ? (
                <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {offchain.fetchError}
                </div>
              ) : null}

              {offchain.parsed !== undefined && offchain.parsed !== null ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Parsed JSON</h3>
                  <pre className="max-h-[min(28rem,70vh)] overflow-auto rounded-lg border border-border bg-black/30 p-3 text-xs text-muted font-mono whitespace-pre-wrap break-all">
                    {formatParsedJson(offchain.parsed)}
                  </pre>
                </div>
              ) : null}

              {offchain.rawPreview ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle">Raw body (preview)</h3>
                  <pre className="max-h-[min(28rem,70vh)] overflow-auto rounded-lg border border-border bg-black/30 p-3 text-xs text-muted font-mono whitespace-pre-wrap break-all">
                    {offchain.rawPreview}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
