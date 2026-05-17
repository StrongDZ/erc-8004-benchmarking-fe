import { Suspense } from 'react';
import { FeedbackUriPageClient } from './FeedbackUriPageClient';

export default function FeedbackUriPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="card p-6 text-center text-muted text-sm">Loading…</div>
        </div>
      }
    >
      <FeedbackUriPageClient />
    </Suspense>
  );
}
