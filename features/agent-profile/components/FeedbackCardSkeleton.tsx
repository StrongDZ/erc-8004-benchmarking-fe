import { Skeleton } from '@/shared/ui/Skeleton';

export function FeedbackCardSkeleton() {
  return (
    <div className="card rounded-xl p-4 border border-white/5 space-y-3">
      {/* Identity row: avatar, address, time, category pill */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-24 ml-auto" />
      </div>
      {/* Content: two text lines */}
      <div className="space-y-1.5 pl-11">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      {/* Meta footer: two tag pills + value pill */}
      <div className="flex items-center gap-2 pl-11">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full ml-auto" />
      </div>
    </div>
  );
}
