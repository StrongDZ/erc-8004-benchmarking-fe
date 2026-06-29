'use client';
// shared/ui/AddressLabel.tsx
// Displays a wallet address as ENS name + avatar when available,
// otherwise truncated hex + pixel avatar. Links to the wallet profile.

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { truncateAddress } from '@/shared/api/client';
import { useWalletENS } from '@/shared/hooks/useWalletENS';
import { WalletAvatar } from '@/shared/ui/WalletAvatar';

interface AddressLabelProps {
    address: string;
    /** Truncation length passed to truncateAddress when no ENS name is resolved. */
    chars?: number;
    className?: string;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
    /** Pixel size for the wallet avatar. */
    avatarSize?: number;
    /** When false, hides the avatar (label only). */
    showAvatar?: boolean;
    /** When false, renders a span instead of a profile link. */
    link?: boolean;
}

export function AddressLabel({
    address,
    chars = 6,
    className,
    onClick,
    avatarSize = 16,
    showAvatar = true,
    link = true,
}: AddressLabelProps) {
    const ens = useWalletENS(address);
    const label = ens?.ens || truncateAddress(address, chars);
    const title = ens?.ens ? `${ens.ens} (${address})` : address;

    const content = (
        <>
            {showAvatar && <WalletAvatar address={address} size={avatarSize} className="shrink-0" alt={label} />}
            <span className="truncate">{label}</span>
        </>
    );

    const mergedClassName = ['inline-flex min-w-0 items-center gap-1.5', className].filter(Boolean).join(' ');

    if (!link) {
        return (
            <span className={mergedClassName} title={title}>
                {content}
            </span>
        );
    }

    return (
        <Link href={`/wallet/${address}`} className={mergedClassName} onClick={onClick} title={title}>
            {content}
        </Link>
    );
}
