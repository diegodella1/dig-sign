export type ModeSubNavItem = {
    label: string;
    href: string;
    match?: string[];
};

export const prepareSubNav: ModeSubNavItem[] = [
    { label: 'Overview', href: '/admin/prepare' },
    { label: 'Plates', href: '/admin/slides', match: ['/admin/slides'] },
    { label: 'Media', href: '/admin/assets', match: ['/admin/assets'] },
    { label: 'Import', href: '/admin/vimeo', match: ['/admin/vimeo'] },
    { label: 'Music', href: '/admin/music', match: ['/admin/music'] },
];

export const programSubNav: ModeSubNavItem[] = [
    { label: 'Screens', href: '/admin/screens', match: ['/admin/screens'] },
    { label: 'Playlists', href: '/admin/playlists', match: ['/admin/playlists'] },
];

/** @deprecated Use programSubNav. Kept for legacy imports during redirect cleanup. */
export function programSubNavForDate(): ModeSubNavItem[] {
    return programSubNav;
}

export const adminSubNav: ModeSubNavItem[] = [
    { label: 'Settings', href: '/admin/settings' },
    { label: 'Health', href: '/admin/health', match: ['/admin/health'] },
    { label: 'Audit', href: '/admin/audit', match: ['/admin/audit'] },
    { label: 'Capture', href: '/admin/operate', match: ['/admin/operate'] },
];
