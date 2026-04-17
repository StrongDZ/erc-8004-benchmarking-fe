import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full w-full h-full"></div>
        <h1 className="text-9xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-2xl">
          404
        </h1>
      </div>
      <h2 className="text-2xl md:text-3xl font-heading mb-4 text-white">System Anomaly Detected</h2>
      <p className="text-muted text-lg max-w-md mb-8">
        The sector you are trying to access does not exist on the current network. The pathway may have been expunged or recalibrated.
      </p>
      <Link href="/" className="btn btn-primary px-8 py-3 text-lg rounded-full font-bold shadow-[0_0_20px_var(--color-primary-glow)] hover:shadow-[0_0_30px_var(--color-primary-glow)] transition-shadow">
        Return to Leaderboard
      </Link>
    </div>
  );
}
