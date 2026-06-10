'use client';

import { useState } from 'react';
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
import { AgentAvatar } from '@/shared/ui/AgentAvatar';
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
  const [contentExpanded, setContentExpanded] = useState(false);

  const isRevoked = !!fb.revokeTxHash;
  const ms = feedbackEventTimeMs(fb.timestamp, fb.timestampUnix);
  const comment = fb.feedbackParsed?.comment ?? '';
  const attachments = Array.isArray(fb.feedbackParsed?.attachments) ? fb.feedbackParsed.attachments : [];
  const hasContent = comment.trim().length > 0 || attachments.length > 0;
  const isLong = comment.length > 240;

  const tag1 = fb.tag1?.trim();
  const tag2 = fb.tag2?.trim();
  const tagLabel = [tag1, tag2].filter(Boolean).join(' | ');

  const hasVia = !!(fb.endpoint?.trim() || fb.feedbackURI);

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
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <AgentAvatar seed={fb.clientAddress} size={34} className="mt-0.5" />

        {/* Left info block */}
        <div className="min-w-0 flex-1">
          {/* Row 1: address + index + category */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={`/wallet/${fb.clientAddress}`}
              className="font-mono text-xs text-white hover:text-primary transition-colors truncate"
              title={fb.clientAddress}
            >
              {truncateAddress(fb.clientAddress)}
            </Link>
            <span className="font-mono text-[11px] text-subtle tabular-nums">
              #{fb.feedbackIndex}
            </span>
            <FeedbackCategoryBadge
              category={resolveFeedbackDisplayCategory(fb.classification)}
              title={feedbackClassificationTitle(fb.classification)}
              badgeSize="xs"
            />
            {isRevoked && (
              <Badge variant="danger" size="xs">Revoked</Badge>
            )}
          </div>

          {/* Row 2: txHash · time */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
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
            {fb.txHash && ms !== null && <span className="text-subtle/50 text-[11px]">·</span>}
            {ms !== null && (
              <span
                className="text-[11px] text-subtle"
                title={new Date(ms).toLocaleString()}
              >
                {relativeTime(ms)}
              </span>
            )}
          </div>

          {/* Via line — only rendered when endpoint or feedbackURI exists.
               Endpoint is fixed w-[10rem] so feedbackURI always sits at the same position. */}
          {hasVia && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-subtle/60 shrink-0">via</span>
              {/* Fixed-width slot: endpoint or empty spacer to hold position */}
              <span className="w-[10rem] min-w-0 shrink-0">
                {fb.endpoint?.trim() ? (
                  <LinkOutbound
                    href={ensureHttpsUrl(fb.endpoint)}
                    external
                    className="font-mono text-[11px] text-subtle hover:text-muted transition-colors w-full"
                    title={fb.endpoint}
                  >
                    {fb.endpoint.replace(/^https?:\/\//, '')}
                  </LinkOutbound>
                ) : null}
              </span>
              {fb.feedbackURI && (
                <LinkOutbound
                  href={resolveIPFS(fb.feedbackURI)}
                  external
                  className="text-[11px] text-subtle hover:text-accent transition-colors shrink-0"
                  title={fb.feedbackURI}
                >
                  URI
                </LinkOutbound>
              )}
            </div>
          )}
        </div>

        {/* Right panel: bordered box wrapping tags + value together */}
        <div className="shrink-0 ml-2 flex flex-col items-end gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 min-w-[6rem]">
          {tagLabel && (
            <span
              className="font-mono text-[11px] text-subtle/80 max-w-[10rem] truncate text-right w-full"
              title={tagLabel}
            >
              {tagLabel}
            </span>
          )}
          <FeedbackValuePill fb={fb} revoked={isRevoked} />
        </div>
      </div>

      {/* ── Content (aligned with avatar) ── */}
      {hasContent && (
        <div className="mt-3 pl-[46px]">
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
            <div className={comment ? 'mt-2' : ''}>
              <FeedbackContentCell comment="" attachments={attachments} />
            </div>
          )}
        </div>
      )}

      {/* ── Replies ── */}
      <FeedbackReplies responses={fb.responses} chainId={chainId} />
    </div>
  );
}
