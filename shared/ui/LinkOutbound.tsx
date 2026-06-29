'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { ExternalLink } from 'lucide-react';

const extIconClass = 'shrink-0 flex-none opacity-80 h-3.5 w-3.5';

export function LinkOutbound({
  href,
  external,
  className = '',
  children,
  ...rest
}: ComponentProps<'a'> & { href: string; external?: boolean }) {
  const showExternalMarker = !!external;
  const rootClass = `inline-flex max-w-full min-w-0 items-center ${className}`.trim();
  const content =
    typeof children === 'string' || typeof children === 'number' ? (
      <span className="min-w-0 truncate">{children}</span>
    ) : (
      children
    );
  const body = (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">{content}</span>
      {showExternalMarker ? (
        <ExternalLink className={extIconClass} aria-hidden strokeWidth={2.25} />
      ) : null}
    </span>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={rootClass}
        {...rest}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={rootClass} {...rest}>
      {body}
    </Link>
  );
}
