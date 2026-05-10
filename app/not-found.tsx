import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center fade-in">
      <div className="mb-8">
        <h1 className="text-9xl font-bold font-heading text-primary drop-shadow-2xl">
          404
        </h1>
      </div>
      <h2 className="text-2xl md:text-3xl font-heading mb-4 text-white">System Anomaly Detected</h2>
      <p className="text-muted text-lg max-w-md mb-8">
        The sector you are trying to access does not exist on the current network. The pathway may have been expunged or recalibrated.
      </p>
      <Link href="/" className="btn btn-primary px-8 py-3 text-lg rounded-full font-bold">
        Return to Leaderboard
      </Link>
    </div>
  );
}
