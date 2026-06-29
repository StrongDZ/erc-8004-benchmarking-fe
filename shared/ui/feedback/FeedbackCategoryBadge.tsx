'use client';

import { feedbackCategoryDisplayLabel } from '@/shared/lib/feedback/feedbackCategories';
import { Badge, type BadgeProps, type BadgeSize } from '@/shared/ui/Badge';

export interface FeedbackCategoryBadgeProps {
  category?: string | null;
  badgeSize?: BadgeSize;
  title?: string;
}

type BadgeVariant = BadgeProps['variant'];

function categoryVariant(cat: string): BadgeVariant {
  switch (cat) {
    case 'quality':
    case 'service_feedback': // legacy rows
    case 'config_feedback':
      return 'accent';
    case 'quantity':
    case 'app_specific':
      return 'primary';
    case 'junk':
    case 'spam':
    case 'noise':
      return 'danger';
    case 'others':
      return 'muted';
    default:
      return 'muted';
  }
}

export function FeedbackCategoryBadge({ category, badgeSize = 'sm', title }: FeedbackCategoryBadgeProps) {
  const raw = category?.trim();
  const label = raw && raw.length > 0 ? feedbackCategoryDisplayLabel(raw) : 'unknown';
  const variantKey = raw && raw.length > 0 ? raw : 'unknown';
  return (
    <Badge variant={categoryVariant(variantKey)} size={badgeSize} title={title}>
      {label}
    </Badge>
  );
}
