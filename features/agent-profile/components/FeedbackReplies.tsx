'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { truncateAddress, explorerUrl } from '@/shared/api/client';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import type { Feedback } from '@/shared/api/types';

type Response = NonNullable<Feedback['responses']>[number];

interface FeedbackRepliesProps {
  responses: Feedback['responses'];
  chainId: number;
}

const INITIAL_VISIBLE = 3;

function ReplyRow({ res, chainId }: { res: Response; chainId: number }) {
  const [expanded, setExpanded] = useState(false);
  const comment = res.responseParsed?.comment ?? '';
  const isLong = comment.length > 160;

  return (
    <div className="relative pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:rounded-full before:bg-purple-900/60">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5">
        <Link
          href={`/wallet/${res.responder}`}
          className="font-mono text-xs text-muted hover:text-primary transition-colors truncate"
          title={res.responder}
        >
          {truncateAddress(res.responder)}
        </Link>
        {res.txHash && (
          <LinkOutbound
            href={explorerUrl(chainId, res.txHash)}
            external
            className="font-mono text-[11px] text-subtle hover:text-primary transition-colors"
            title={res.txHash}
          >
            {res.txHash.slice(0, 6)}…{res.txHash.slice(-4)}
          </LinkOutbound>
        )}
      </div>
      {comment && (
        <p
          className={`text-xs text-muted leading-relaxed whitespace-pre-wrap break-words ${!expanded && isLong ? 'line-clamp-2' : ''}`}
        >
          {comment}
        </p>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export function FeedbackReplies({ responses, chainId }: FeedbackRepliesProps) {
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (!responses || responses.length === 0) return null;

  const total = responses.length;
  const hidden = Math.max(0, total - visibleCount);
  const visible = responses.slice(0, visibleCount);

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mb-2"
      >
        <MessageSquare size={13} />
        {open ? `Hide ${total} ${total === 1 ? 'reply' : 'replies'}` : `${total} ${total === 1 ? 'reply' : 'replies'}`}
      </button>

      {open && (
        <div className="space-y-3 ml-2">
          {visible.map((res, i) => (
            <ReplyRow key={res.txHash || i} res={res} chainId={chainId} />
          ))}

          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 10)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors pl-4"
            >
              + {hidden} more {hidden === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
