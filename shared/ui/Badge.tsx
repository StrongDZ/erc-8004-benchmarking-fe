import React from 'react';

export type BadgeSize = 'xxs' | 'xs' | 'sm' | 'md';
export type BadgeRounded = 'pill' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'accent' | 'muted';
  /** Density / typography tier. Default `sm` matches legacy global `.badge`. */
  size?: BadgeSize;
  /** Defaults: `pill` for xs/sm/xxs, `md` for size `md`. */
  rounded?: BadgeRounded;
}

const sizeClasses: Record<BadgeSize, string> = {
  xxs: '!text-[9px] !px-1 !py-0 !gap-0 !uppercase !tracking-wide !leading-none !h-4 !min-h-0',
  xs:  '!text-[10px] !px-2 !py-0.5 !gap-0.5 !uppercase !tracking-wider !leading-tight',
  sm:  '!text-[11px] !px-2.5 !py-1 !gap-1 !uppercase !tracking-wide !leading-tight',
  md:  '!text-xs sm:!text-[0.8125rem] !px-3.5 !py-2 !gap-1.5 !font-semibold !normal-case !tracking-normal !leading-none',
};

const roundedClasses: Record<BadgeRounded, string> = {
  pill: '!rounded-full',
  md: '!rounded-[var(--radius-md)]',
};

export function Badge({
  className = '',
  variant = 'default',
  size = 'sm',
  rounded,
  ...props
}: BadgeProps) {
  const variantClass = variant === 'default' ? 'badge-default' : `badge-${variant}`;
  const defaultRounded: BadgeRounded = size === 'md' ? 'md' : 'pill';  // xxs/xs/sm → pill
  const r = rounded ?? defaultRounded;

  return (
    <span
      className={[
        'badge inline-flex items-center font-semibold border',
        variantClass,
        sizeClasses[size],
        roundedClasses[r],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
