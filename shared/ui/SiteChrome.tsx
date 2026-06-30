'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/shared/ui/Navbar';

// SiteChrome renders the public navbar + main wrapper for normal routes, and
// nothing for /admin/* — the admin console (app/admin/layout.tsx) ships its own
// operator header and must not share the public navigation that regular users use.
export default function SiteChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) {
        return <>{children}</>;
    }
    return (
        <>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)] overflow-x-hidden pt-4 pb-12">{children}</main>
        </>
    );
}
