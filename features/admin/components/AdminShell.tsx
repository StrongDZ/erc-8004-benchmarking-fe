'use client';

import type { ReactNode } from 'react';
import { useAdminAuth } from '@/features/admin/auth/AdminAuthProvider';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { AdminGate } from '@/features/admin/components/AdminGate';

// Renders the operator header always, and gates the console body behind unlock.
export function AdminShell({ children }: { children: ReactNode }) {
    const { unlocked } = useAdminAuth();
    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            {unlocked ? (
                <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
            ) : (
                <AdminGate />
            )}
        </div>
    );
}
