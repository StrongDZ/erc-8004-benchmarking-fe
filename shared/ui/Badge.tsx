import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'accent' | 'muted';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`badge badge-${variant} ${className}`}
      {...props}
    />
  );
}
