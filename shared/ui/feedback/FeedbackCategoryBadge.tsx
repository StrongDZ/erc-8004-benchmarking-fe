'use client';

import { Badge, type BadgeProps, type BadgeSize } from '@/shared/ui/Badge';

export interface FeedbackCategoryBadgeProps {
  category?: string | null;
  badgeSize?: BadgeSize;
  title?: string;
}

type BadgeVariant = BadgeProps['variant'];

function categoryVariant(cat: string): BadgeVariant {
  switch (cat) {
    case 'service_feedback': return 'accent';
    case 'config_feedback':  return 'warning';
    case 'spam':             return 'danger';
    case 'app_specific':     return 'primary';
    default:                 return 'muted';
  }
}

export function FeedbackCategoryBadge({ category, badgeSize = 'sm', title }: FeedbackCategoryBadgeProps) {
  const c = category?.trim();
  const label = c && c.length > 0 ? c : 'unknown';
  return (
    <Badge variant={categoryVariant(label)} size={badgeSize} title={title}>
      {label}
    </Badge>
  );
}
