'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import { resolveIPFS } from '@/shared/api/client';

export interface FeedbackAttachment {
  name?: string;
  uri?: string;
  mimeType?: string;
  size?: number;
}

interface FeedbackContentCellProps {
  comment?: string;
  attachments?: FeedbackAttachment[];
}

export function FeedbackContentCell({ comment = '', attachments = [] }: FeedbackContentCellProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPopoverOpen]);

  const hasAttachments = attachments && attachments.length > 0;
  const visibleAttachments = attachments.slice(0, 2);
  const hiddenCount = attachments.length - visibleAttachments.length;

  // Tooltip content: Full comment + attachment names
  const tooltipContent = [
    comment,
    hasAttachments ? `\nAttachments:\n${attachments.map(a => a.name || a.uri || 'Unnamed').join('\n')}` : ''
  ].filter(Boolean).join('\n');

  if (!comment && !hasAttachments) {
    return <span className="text-subtle">—</span>;
  }

  return (
    <div className="relative flex flex-col gap-1 w-full min-w-[8rem] max-w-[14rem]" title={tooltipContent}>
      {comment && (
        <div 
          className="text-xs text-muted" 
          style={{ 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}
        >
          {comment}
        </div>
      )}
      
      {hasAttachments && (
        <div className="flex flex-wrap items-center gap-1 mt-0.5" ref={popoverRef}>
          {visibleAttachments.map((att, i) => (
             <button
               key={i}
               type="button"
               onClick={() => setIsPopoverOpen(!isPopoverOpen)}
               className="inline-flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-muted px-1.5 py-0.5 rounded transition-colors border border-white/5"
               title={att.name || 'Attachment'}
             >
               <Paperclip size={10} className="shrink-0" />
               <span className="max-w-[4rem] truncate">{att.name || 'File'}</span>
             </button>
          ))}
          {hiddenCount > 0 && (
             <button
               type="button"
               onClick={() => setIsPopoverOpen(!isPopoverOpen)}
               className="inline-flex items-center text-[10px] bg-white/5 hover:bg-white/10 text-muted px-1.5 py-0.5 rounded transition-colors border border-white/5"
             >
               +{hiddenCount}
             </button>
          )}

          {isPopoverOpen && (
            <div className="absolute top-full left-0 mt-1 z-[9999] min-w-[12rem] max-w-[16rem] bg-[#1a1b1e] border border-border rounded-lg shadow-xl py-1 px-1 flex flex-col gap-1">
              <div className="text-[10px] uppercase font-semibold text-subtle px-2 py-1 border-b border-border/50">Attachments</div>
              <div className="max-h-[12rem] overflow-y-auto flex flex-col gap-0.5">
                {attachments.map((att, idx) => {
                  const href = att.uri ? resolveIPFS(att.uri) : '#';
                  return (
                    <a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted hover:text-primary hover:bg-white/5 px-2 py-1.5 rounded transition-colors"
                      title={att.name || att.uri}
                    >
                      <Paperclip size={12} className="shrink-0" />
                      <span className="truncate">{att.name || att.uri || `Attachment ${idx + 1}`}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
