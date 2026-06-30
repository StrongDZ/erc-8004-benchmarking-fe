import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminAuthProvider } from '@/features/admin/auth/AdminAuthProvider';
import { AdminShell } from '@/features/admin/components/AdminShell';

export const metadata: Metadata = {
    title: 'Admin Console · ERC-8004',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminAuthProvider>
            <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
    );
}
