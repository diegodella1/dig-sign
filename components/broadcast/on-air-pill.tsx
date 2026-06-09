import { StatusBadge } from '@/components/broadcast/status-badge';

export function OnAirPill({ isLive, dayStatus }: { isLive: boolean; dayStatus: string }) {
    if (isLive) {
        return (
            <StatusBadge tone="live" pulse>
                On air
            </StatusBadge>
        );
    }

    if (dayStatus === 'active') {
        return <StatusBadge tone="warn">Active · idle</StatusBadge>;
    }

    return <StatusBadge tone="idle">Off air</StatusBadge>;
}
