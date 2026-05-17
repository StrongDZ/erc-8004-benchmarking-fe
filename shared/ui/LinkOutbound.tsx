'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { ExternalLink } from 'lucide-react';

const extIconClass = 'inline-block shrink-0 opacity-80 h-3.5 w-3.5 translate-y-px';

export function LinkOutbound({
  href,
  external,
  className = '',
  children,
  ...rest
}: ComponentProps<'a'> & { href: string; external?: boolean }) {
  const showExternalMarker = !!external;
  const body = (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {showExternalMarker ? (
        <ExternalLink className={`${extIconClass} shrink-0 flex-none`} aria-hidden strokeWidth={2.25} />
      ) : null}
    </span>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`max-w-full min-w-0 ${className}`.trim()}
        {...rest}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={`max-w-full min-w-0 ${className}`.trim()} {...rest}>
      {body}
    </Link>
  );
}
