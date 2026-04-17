import { AlertTriangle, Clock } from 'lucide-react';

export default function PenaltiesPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12 fade-in">
      <div className="mb-10 text-center sm:text-left">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-2 text-white transform md:origin-left transition-transform">Penalty Log</h1>
          <p className="text-muted text-base max-w-2xl">
            Real-time feed of penalized or slashed agents in the TrustRank system.
          </p>
        </div>
      </div>
      
      <div className="card-glass border-border p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <Clock size={32} />
        </div>
        <h2 className="text-2xl font-bold font-heading text-white mb-2">Penalties System Activating</h2>
        <p className="text-muted text-lg max-w-md mb-8">
          The global penalty log is currently synchronizing with on-chain data. Slashed agents and historic infractions will be available in the upcoming epoch.
        </p>
        <button className="btn btn-outline text-white hover:text-danger hover:border-danger hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]" disabled>
          <AlertTriangle size={18} className="mr-2" />
          Awaiting Network Sync...
        </button>
      </div>
    </div>
  );
}
