'use client';

import { Badge, type BadgeProps, type BadgeSize } from '@/shared/ui/Badge';

export interface FeedbackFeatureBadgeProps {
  feature?: string | null;
  badgeSize?: BadgeSize;
  title?: string;
}

type BadgeVariant = BadgeProps['variant'];

function featureVariant(feature: string): BadgeVariant {
  switch (feature) {
    case 'infrastructure': return 'muted';
    case 'agent_domain':   return 'primary';
    case 'both':           return 'accent';
    case 'self_feedback':  return 'warning';
    default:               return 'muted';
  }
}

export function FeedbackFeatureBadge({ feature, badgeSize = 'sm', title }: FeedbackFeatureBadgeProps) {
  const f = feature?.trim();
  if (!f) return null;
  return (
    <Badge variant={featureVariant(f)} size={badgeSize} title={title}>
      {f}
    </Badge>
  );
}
