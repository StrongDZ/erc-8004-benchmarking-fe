'use client';

import Link from 'next/link';
import { FileText, RotateCcw } from 'lucide-react';
import { explorerUrl, resolveIPFS, truncateAddress } from '@/shared/api/client';
import { feedbackEventTimeMs } from '@/shared/lib/feedbackTimestamp';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';

const ICON = 16;
const DOT = 'text-muted/80';

const endpointPillClass =
  'inline-flex items-center rounded-lg px-2.5 py-1 text-[12px] font-mono bg-primary/15 text-primary border border-primary/35 max-w-full sm:max-w-[min(100%,280px)] truncate';

export type FeedbackMetaVariant = 'wallet' | 'agent';

export interface FeedbackMetaRowProps {
  variant: FeedbackMetaVariant;
  chainId: number;
  timestamp: number | string;
  /** Unix seconds from API; used when `timestamp` is ambiguous or ISO. */
  timestampUnix?: number | null;
  txHash?: string | null;
  endpoint?: string | null;
  feedbackURI?: string | null;
  revokeTxHash?: string | null;
  /** agent variant: wallet link */
  clientAddress?: string;
  metaClassName?: string;
}

function endpointHref(endpoint: string): string {
  const e = endpoint.trim();
  if (/^https?:\/\//i.test(e)) return e;
  return `https://${e}`;
}

export function FeedbackMetaRow({
  variant,
  chainId,
  timestamp,
  timestampUnix,
  txHash,
  endpoint,
  feedbackURI,
  revokeTxHash,
  clientAddress,
  metaClassName = 'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtle',
}: FeedbackMetaRowProps) {
  return (
    <div className={metaClassName}>
      {variant === 'agent' && clientAddress && (
        <>
          <Link
            href={`/wallet/${clientAddress}`}
            className="font-mono text-muted hover:text-primary transition-colors"
            title={clientAddress}
          >
            {truncateAddress(clientAddress)}
          </Link>
          <span className={DOT}>·</span>
        </>
      )}

      <span>
        {(() => {
          const ms = feedbackEventTimeMs(timestamp, timestampUnix);
          return ms === null ? '—' : new Date(ms).toLocaleDateString();
        })()}
      </span>

      {txHash && (
        <>
          <span className={DOT}>·</span>
          <LinkOutbound
            href={explorerUrl(chainId, txHash)}
            external
            className="min-w-0 max-w-full font-mono text-[13px] text-muted hover:text-primary transition-colors"
            title="View transaction"
          >
            {txHash.slice(0, 6)}…{txHash.slice(-4)}
          </LinkOutbound>
        </>
      )}

      {endpoint && (
        <>
          <span className={DOT}>·</span>
          <LinkOutbound href={endpointHref(endpoint)} external className={`${endpointPillClass} min-w-0 max-w-full`} title={endpoint}>
            {endpoint.replace(/^https?:\/\//, '')}
          </LinkOutbound>
        </>
      )}

      {feedbackURI && (
        <>
          <span className={DOT}>·</span>
          <LinkOutbound
            href={resolveIPFS(feedbackURI)}
            external
            className="inline-flex text-muted hover:text-accent transition-colors p-0.5"
            title="View IPFS content"
          >
            <FileText size={ICON} />
          </LinkOutbound>
        </>
      )}

      {revokeTxHash && (
        <>
          <span className={DOT}>·</span>
          <LinkOutbound
            href={explorerUrl(chainId, revokeTxHash)}
            external
            className="inline-flex text-muted hover:text-danger transition-colors p-0.5"
            title="Revoke transaction"
          >
            <RotateCcw size={ICON} />
          </LinkOutbound>
        </>
      )}
    </div>
  );
}
