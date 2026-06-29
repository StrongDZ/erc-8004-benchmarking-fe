'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { explorerUrl, resolveIPFS } from '@/shared/api/client';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { AddressLabel } from '@/shared/ui/AddressLabel';
import { FeedbackContentCell } from '@/shared/ui/feedback';
import type { Feedback } from '@/shared/api/types';

type Response = NonNullable<Feedback['responses']>[number];

interface FeedbackRepliesProps {
  responses: Feedback['responses'];
  chainId: number;
}

const INITIAL_VISIBLE = 3;

function ReplyCard({ res, chainId }: { res: Response; chainId: number }) {
  const [expanded, setExpanded] = useState(false);
  const comment: string = res.responseParsed?.comment ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachments: any[] = Array.isArray(res.responseParsed?.attachments)
    ? res.responseParsed.attachments
    : [];
  const isLong = comment.length > 200;
  const hasContent = comment.trim().length > 0 || attachments.length > 0;

  return (
    <div className="relative pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:rounded-full before:bg-purple-900/50">
      {/* Mini header: avatar + address + txHash */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <AddressLabel
              address={res.responder}
              avatarSize={24}
              className="font-mono text-xs text-white hover:text-primary transition-colors truncate"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {res.txHash && (
              <LinkOutbound
                href={explorerUrl(chainId, res.txHash)}
                external
                className="font-mono text-2xs text-subtle hover:text-muted transition-colors"
                title={res.txHash}
              >
                {res.txHash.slice(0, 8)}…{res.txHash.slice(-6)}
              </LinkOutbound>
            )}
            {res.responseURI && (
              <>
                <span className="text-subtle/50 text-2xs">·</span>
                <LinkOutbound
                  href={resolveIPFS(res.responseURI)}
                  external
                  className="text-2xs text-subtle hover:text-accent transition-colors"
                  title={res.responseURI}
                >
                  URI
                </LinkOutbound>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comment + attachments */}
      {hasContent && (
        <div className="mt-2 pl-8">
          {comment && (
            <div>
              <p
                className={[
                  'text-xs text-muted leading-relaxed whitespace-pre-wrap break-words',
                  !expanded && isLong ? 'line-clamp-2' : '',
                ].join(' ')}
              >
                {comment}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-2xs text-purple-400 hover:text-purple-300 transition-colors mt-0.5"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
          {attachments.length > 0 && (
            <div className={comment ? 'mt-1.5' : ''}>
              <FeedbackContentCell comment="" attachments={attachments} />
            </div>
          )}
        </div>
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
    <div className="mt-3 pt-3 border-t border-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
      >
        <MessageSquare size={13} />
        {open
          ? `Hide ${total} ${total === 1 ? 'reply' : 'replies'}`
          : `${total} ${total === 1 ? 'reply' : 'replies'}`}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {visible.map((res, i) => (
            <ReplyCard key={res.txHash || i} res={res} chainId={chainId} />
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
