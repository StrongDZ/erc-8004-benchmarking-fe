/** Runtime feedback categories (aligns with BE classifier: quality | quantity | junk | others). */
export const FEEDBACK_FILTER_CATEGORIES = ['all', 'quality', 'quantity', 'junk', 'others'] as const;

export type FeedbackFilterCategory = (typeof FEEDBACK_FILTER_CATEGORIES)[number];

const LABELS: Record<string, string> = {
  all: 'All',
  quality: 'Quality',
  quantity: 'Quantity',
  junk: 'Junk',
  others: 'Evaluating',
};

export function feedbackCategoryDisplayLabel(category: string): string {
  const key = category.trim().toLowerCase();
  if (key in LABELS && key !== 'all') return LABELS[key];
  return category.replaceAll('_', ' ');
}

export function feedbackCategoryFilterLabel(category: string): string {
  if (category === 'all') return LABELS.all;
  return feedbackCategoryDisplayLabel(category);
}
