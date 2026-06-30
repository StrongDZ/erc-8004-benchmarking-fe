'use client';

import { useState } from 'react';
import { IndexerStatusPanel } from '@/features/admin/components/IndexerStatusPanel';
import { RecomputePanel } from '@/features/admin/components/RecomputePanel';
import { SimulatorPanel } from '@/features/admin/components/SimulatorPanel';
import { ActivityLog, type LogEntry } from '@/features/admin/components/ActivityLog';

export default function AdminPage() {
    const [log, setLog] = useState<LogEntry[]>([]);
    const pushLog = (entry: LogEntry) => setLog((prev) => [entry, ...prev].slice(0, 20));

    return (
        <div className="space-y-8">
            {/* Use case: Monitor Indexer Status */}
            <IndexerStatusPanel />

            {/* Use cases: Trigger Score Recomputation · Start Feedback Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecomputePanel onLog={pushLog} />
                <SimulatorPanel onLog={pushLog} />
            </div>

            <ActivityLog log={log} onClear={() => setLog([])} />
        </div>
    );
}
