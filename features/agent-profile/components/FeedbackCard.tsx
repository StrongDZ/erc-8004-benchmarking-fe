'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { truncateAddress, explorerUrl, resolveIPFS } from '@/shared/api/client';
import { ensureHttpsUrl } from '@/shared/api/utils/format';
import { feedbackEventTimeMs } from '@/shared/lib/feedbackTimestamp';
import {
  feedbackClassificationTitle,
  resolveFeedbackDisplayCategory,
} from '@/shared/lib/feedbackClassification';
import { Badge } from '@/shared/ui/Badge';
import { FeedbackCategoryBadge, FeedbackValuePill, FeedbackContentCell } from '@/shared/ui/feedback';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { FeedbackReplies } from './FeedbackReplies';
import type { Feedback } from '@/shared/api/types';

interface FeedbackCardProps {
  feedback: Feedback;
  chainId: number;
}

function relativeTime(ms: number | null): string {
  if (ms === null) return '—';
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function FeedbackCard({ feedback: fb, chainId }: FeedbackCardProps) {
  const [metaOpen, setMetaOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);

  const isRevoked = !!fb.revokeTxHash;
  const ms = feedbackEventTimeMs(fb.timestamp, fb.timestampUnix);
  const comment = fb.feedbackParsed?.comment ?? '';
  const attachments = Array.isArray(fb.feedbackParsed?.attachments) ? fb.feedbackParsed.attachments : [];
  const hasContent = comment.trim().length > 0 || attachments.length > 0;
  const isLong = comment.length > 240;

  // Only show Details drawer when there's genuinely interesting collapsible content.
  // txHash is always present but shown inline in the footer — not a drawer trigger.
  const hasMeta = !!(fb.tag1?.trim() || fb.tag2?.trim() || fb.endpoint?.trim() || fb.feedbackURI);

  return (
    <div
      className={[
        'card rounded-xl border p-4 transition-colors',
        isRevoked
          ? 'opacity-60 border-red-500/20'
          : 'border-white/5 hover:border-purple-500/20',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-subtle tabular-nums shrink-0 pt-0.5">
          #{fb.feedbackIndex}
        </span>
        <Link
          href={`/wallet/${fb.clientAddress}`}
          className="font-mono text-xs text-muted hover:text-primary transition-colors min-w-0 truncate"
          title={fb.clientAddress}
        >
          {truncateAddress(fb.clientAddress)}
        </Link>
        <span
          className="text-xs text-subtle shrink-0"
          title={ms !== null ? new Date(ms).toLocaleString() : undefined}
        >
          {relativeTime(ms)}
        </span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <FeedbackCategoryBadge
            category={resolveFeedbackDisplayCategory(fb.classification)}
            title={feedbackClassificationTitle(fb.classification)}
            badgeSize="xs"
          />
          {isRevoked && (
            <Badge variant="danger" size="xs">
              Revoked
            </Badge>
          )}
          <FeedbackValuePill fb={fb} revoked={isRevoked} />
        </div>
      </div>

      {/* ── Content ── */}
      {hasContent && (
        <div className="mt-3 space-y-2">
          {comment && (
            <div>
              <p
                className={[
                  'text-sm text-muted leading-relaxed whitespace-pre-wrap break-words',
                  !contentExpanded && isLong ? 'line-clamp-3' : '',
                ].join(' ')}
              >
                {comment}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setContentExpanded((v) => !v)}
                  className="mt-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {contentExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
          {attachments.length > 0 && (
            <FeedbackContentCell comment="" attachments={attachments} />
          )}
        </div>
      )}

      {/* ── Meta drawer — tags / endpoint / URI (no date — already in header) ── */}
      {hasMeta && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setMetaOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-subtle hover:text-muted transition-colors"
          >
            {metaOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {metaOpen ? 'Hide details' : 'Details'}
          </button>
          <div
            className={[
              'grid transition-all duration-200 ease-in-out',
              metaOpen ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]',
            ].join(' ')}
          >
            <div className="overflow-hidden space-y-2">
              {(fb.tag1?.trim() || fb.tag2?.trim()) && (
                <div className="flex flex-wrap gap-1.5">
                  {fb.tag1?.trim() && (
                    <span
                      className="font-mono text-[11px] text-subtle bg-white/5 px-2 py-0.5 rounded max-w-[20rem] truncate"
                      title={fb.tag1}
                    >
                      {fb.tag1}
                    </span>
                  )}
                  {fb.tag2?.trim() && (
                    <span
                      className="font-mono text-[11px] text-subtle bg-white/5 px-2 py-0.5 rounded max-w-[20rem] truncate"
                      title={fb.tag2}
                    >
                      {fb.tag2}
                    </span>
                  )}
                </div>
              )}
              {fb.endpoint?.trim() && (
                <LinkOutbound
                  href={ensureHttpsUrl(fb.endpoint)}
                  external
                  className="inline-flex font-mono text-[11px] text-muted hover:text-primary transition-colors max-w-full"
                  title={fb.endpoint}
                >
                  {fb.endpoint.replace(/^https?:\/\//, '')}
                </LinkOutbound>
              )}
              {fb.feedbackURI && (
                <LinkOutbound
                  href={resolveIPFS(fb.feedbackURI)}
                  external
                  className="inline-flex text-[11px] text-muted hover:text-accent transition-colors"
                  title={fb.feedbackURI}
                >
                  Feedback URI
                </LinkOutbound>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer: always-visible txHash + optional revoke link ── */}
      {(fb.txHash || fb.revokeTxHash) && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {fb.txHash && (
            <LinkOutbound
              href={explorerUrl(chainId, fb.txHash)}
              external
              className="font-mono text-[11px] text-subtle hover:text-muted transition-colors"
              title={fb.txHash}
            >
              {fb.txHash.slice(0, 8)}…{fb.txHash.slice(-6)}
            </LinkOutbound>
          )}
          {fb.revokeTxHash && (
            <LinkOutbound
              href={explorerUrl(chainId, fb.revokeTxHash)}
              external
              className="inline-flex items-center gap-1 text-[11px] text-danger/70 hover:text-danger transition-colors"
              title={`Revoke tx: ${fb.revokeTxHash}`}
            >
              <RotateCcw size={11} />
              revoke tx
            </LinkOutbound>
          )}
        </div>
      )}

      {/* ── Replies ── */}
      <FeedbackReplies responses={fb.responses} chainId={chainId} />
    </div>
  );
}
