'use client';

import { useState } from 'react';
import Link from 'next/link';
import { explorerUrl } from '@/shared/api/client';
import { ensureHttpsUrl } from '@/shared/api/utils/format';
import { feedbackEventTimeMs } from '@/shared/lib/feedbackTimestamp';
import {
  feedbackClassificationTitle,
  feedbackFeatureTitle,
  resolveFeedbackDisplayCategory,
  resolveFeedbackDisplayFeature,
} from '@/shared/lib/feedbackClassification';
import { Badge } from '@/shared/ui/Badge';
import {
  formatFeedbackScaledRaw,
  formatFeedbackValuePillLabel,
  truncateFeedbackMiddle,
} from '@/shared/lib/feedbackDisplay';
import { feedbackValueContainerClass, feedbackValueTextClass } from '@/shared/lib/feedback/feedbackMetricTone';
import { FeedbackCategoryBadge, FeedbackContentCell, FeedbackFeatureBadge } from '@/shared/ui/feedback';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { AddressLabel } from '@/shared/ui/AddressLabel';
import { AgentAvatar } from '@/shared/ui/AgentAvatar';
import { WalletAvatar } from '@/shared/ui/WalletAvatar';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import type { Chain } from '@/shared/api/types';
import { FeedbackReplies } from './FeedbackReplies';
import type { Feedback } from '@/shared/api/types';

interface FeedbackCardProps {
  feedback: Feedback;
  chainId: number;
  /** Agent profile: show feedback author. Wallet profile: show target agent. */
  variant?: 'by-client' | 'to-agent';
  agentId?: string;
  agentName?: string;
  chain?: Chain;
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

export function FeedbackCard({
  feedback: fb,
  chainId,
  variant = 'by-client',
  agentId,
  agentName,
  chain,
}: FeedbackCardProps) {
  const showAgent = variant === 'to-agent' && agentId;
  const agentTitle = agentName ?? (agentId ? `Agent #${agentId}` : '');
  const avatarSeed = showAgent ? `${chainId}-${agentId}` : null;
  const [contentExpanded, setContentExpanded] = useState(false);

  const isRevoked = !!fb.revokeTxHash;
  const ms = feedbackEventTimeMs(fb.timestamp, fb.timestampUnix);
  const comment = fb.feedbackParsed?.comment ?? '';
  const attachments = Array.isArray(fb.feedbackParsed?.attachments) ? fb.feedbackParsed.attachments : [];
  const hasContent = comment.trim().length > 0 || attachments.length > 0;
  const isLong = comment.length > 240;

  const tag1 = fb.tag1?.trim();
  const tag2 = fb.tag2?.trim();
  const hasBothTags = !!(tag1 && tag2);

  const hasVia = !!(fb.endpoint?.trim() || fb.feedbackURI);

  // Power-user metadata surfaced via tooltip — keeps the pill itself minimal.
  const valueTooltip = [
    `raw=${fb.value ?? ''} · decimals=${fb.valueDecimals ?? 0} → ${formatFeedbackScaledRaw(fb)}`,
    fb.valueScale ? `scale: ${fb.valueScale}` : '',
    fb.vi || fb.wi ? `weight: vi ${fb.vi ?? 0} · wi ${fb.wi ?? 0}` : '',
    fb.priceUSDC > 0 ? `price: ${fb.priceUSDC} USDC` : '',
  ].filter(Boolean).join('\n');

  return (
    <div
      className={[
        'card rounded-xl border p-4 transition-colors',
        isRevoked
          ? 'opacity-60 border-red-500/20'
          : 'border-white/5 hover:border-accent/25',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">

        {showAgent ? (
          <AgentAvatar seed={avatarSeed!} size={40} className="mt-0.5 shrink-0" />
        ) : (
          <WalletAvatar address={fb.clientAddress} size={40} className="mt-0.5 shrink-0" />
        )}

        {/* Left info block */}
        <div className="min-w-0 flex-1">
          {/* Row 1: subject + category + feature. For the wallet-profile (to-agent)
              variant the index + chain badge drop to the row below (see Row 1b). */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {showAgent ? (
              <Link
                href={`/agents/${chainId}/${agentId}`}
                className="text-sm font-semibold text-white hover:text-primary transition-colors truncate"
                title={agentTitle}
              >
                {agentTitle}
              </Link>
            ) : (
              <AddressLabel
                address={fb.clientAddress}
                showAvatar={false}
                chars={8}
                className="font-mono text-sm font-semibold text-white hover:text-primary transition-colors truncate"
              />
            )}
            {!showAgent && (
              <span className="font-mono text-xs text-subtle tabular-nums">
                #{fb.feedbackIndex}
              </span>
            )}
            <FeedbackCategoryBadge
              category={resolveFeedbackDisplayCategory(fb.classification)}
              title={feedbackClassificationTitle(fb.classification)}
              badgeSize="xs"
            />
            <FeedbackFeatureBadge
              feature={resolveFeedbackDisplayFeature(fb.classification)}
              title={feedbackFeatureTitle(fb.classification)}
              badgeSize="xs"
            />
            {isRevoked && (
              <Badge variant="danger" size="xs">Revoked</Badge>
            )}
          </div>

          {/* Row 1b (to-agent only): index + chain badge under the agent name */}
          {showAgent && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="font-mono text-xs text-subtle tabular-nums">
                #{fb.feedbackIndex}
              </span>
              <ChainBadge chainId={chainId} chain={chain} size="sm" />
            </div>
          )}

          {/* Row 2: txHash · time */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {fb.txHash && (
              <LinkOutbound
                href={explorerUrl(chainId, fb.txHash)}
                external
                className="font-mono text-xs text-subtle hover:text-muted transition-colors"
                title={fb.blockNumber ? `${fb.txHash}\nBlock #${fb.blockNumber}` : fb.txHash}
              >
                {fb.txHash.slice(0, 8)}…{fb.txHash.slice(-6)}
              </LinkOutbound>
            )}
            {fb.txHash && ms !== null && <span className="text-subtle/50 text-xs">·</span>}
            {ms !== null && (
              <span
                className="text-xs text-subtle"
                title={new Date(ms).toLocaleString()}
              >
                {relativeTime(ms)}
              </span>
            )}
          </div>

          {/* Row 3+: endpoint + feedback URI (stacked) */}
          {hasVia && (
            <div className="mt-1 flex flex-col gap-0.5">
              {fb.endpoint?.trim() && (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs text-subtle/60">Endpoint:</span>
                  <LinkOutbound
                    href={ensureHttpsUrl(fb.endpoint)}
                    external
                    className="min-w-0 font-mono text-xs text-subtle hover:text-muted transition-colors truncate max-w-[15rem]"
                    title={fb.endpoint}
                  >
                    {fb.endpoint.replace(/^https?:\/\//, '')}
                  </LinkOutbound>
                </div>
              )}
              {fb.feedbackURI && (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs text-subtle/60">Feedback URI:</span>
                  <LinkOutbound
                    href={`/feedback-uri?uri=${encodeURIComponent(fb.feedbackURI)}`}
                    className="min-w-0 font-mono text-xs text-subtle hover:text-accent transition-colors truncate max-w-[15rem]"
                    title={fb.feedbackURI}
                  >
                    {truncateFeedbackMiddle(fb.feedbackURI, 18, 10)}
                  </LinkOutbound>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel: tinted box (value tone) with tag + large score */}
        <div
          className={[
            'shrink-0 ml-2 flex flex-col items-center gap-1 rounded-lg border px-3 py-2 min-w-[6rem]',
            feedbackValueContainerClass(fb, isRevoked),
          ].join(' ')}
        >
          {(tag1 || tag2) && (
            hasBothTags ? (
              <div
                className="grid w-full min-w-0 max-w-[10rem] grid-cols-[1fr_auto_1fr] items-center gap-x-0.5"
                title={`${tag1} | ${tag2}`}
              >
                <div className="flex min-w-0 justify-center overflow-hidden">
                  <span className="truncate font-mono text-2xs text-subtle/80">{tag1}</span>
                </div>
                <span className="shrink-0 font-mono text-2xs text-subtle/50">|</span>
                <div className="flex min-w-0 justify-center overflow-hidden">
                  <span className="truncate font-mono text-2xs text-subtle/80">{tag2}</span>
                </div>
              </div>
            ) : (
              <span
                className="w-full max-w-[10rem] truncate text-center font-mono text-2xs text-subtle/80"
                title={tag1 || tag2}
              >
                {tag1 || tag2}
              </span>
            )
          )}
          <span
            className={[
              'text-2xl font-bold tabular-nums leading-none text-center',
              feedbackValueTextClass(fb, isRevoked),
            ].join(' ')}
            title={valueTooltip}
          >
            {formatFeedbackValuePillLabel(fb)}
          </span>
        </div>
      </div>

      {/* ── Content (aligned with avatar) ── */}
      {hasContent && (
        <div className="mt-3 pl-[52px]">
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
                  className="mt-1 text-xs text-accent hover:text-primary transition-colors"
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