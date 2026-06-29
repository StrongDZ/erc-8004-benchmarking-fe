'use client';

import { useWalletENS } from '@/shared/hooks/useWalletENS';
import { AgentAvatar } from '@/shared/ui/AgentAvatar';

interface WalletAvatarProps {
    address: string;
    size?: number;
    className?: string;
    alt?: string;
}

/** ENS avatar when resolved; otherwise a deterministic pixel avatar from the address. */
export function WalletAvatar({ address, size = 16, className, alt = '' }: WalletAvatarProps) {
    const ens = useWalletENS(address);

    if (ens?.ensAvatar) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={ens.ensAvatar}
                alt={alt || ens.ens || address}
                width={size}
                height={size}
                className={className}
                style={{ flexShrink: 0, objectFit: 'cover', borderRadius: '9999px' }}
            />
        );
    }

    return <AgentAvatar seed={address} size={size} alt={alt || address} className={className} />;
}
