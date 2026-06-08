export type ModeSubNavItem = {
    label: string;
    href: string;
    match?: string[];
};

export const prepareSubNav: ModeSubNavItem[] = [
    { label: 'Overview', href: '/admin/prepare' },
    { label: 'Plates', href: '/admin/slides', match: ['/admin/slides'] },
    { label: 'Fallback', href: '/admin/program/fallback', match: ['/admin/program/fallback'] },
    { label: 'Media', href: '/admin/assets', match: ['/admin/assets'] },
    { label: 'People', href: '/admin/guests', match: ['/admin/guests'] },
    { label: 'Import', href: '/admin/vimeo', match: ['/admin/vimeo'] },
    { label: 'Music', href: '/admin/music', match: ['/admin/music'] },
];

export const programSubNav: ModeSubNavItem[] = [
    { label: 'Overview', href: '/admin/program' },
    { label: 'Calendar', href: '/admin/calendar', match: ['/admin/calendar'] },
];

/** Program sub-nav with a Today tab pointing at the playout date schedule. */
export function programSubNavForDate(today: string): ModeSubNavItem[] {
    return [
        { label: 'Overview', href: '/admin/program' },
        { label: 'Calendar', href: '/admin/calendar', match: ['/admin/calendar'] },
        {
            label: 'Fallback',
            href: '/admin/program/fallback',
            match: ['/admin/program/fallback'],
        },
        {
            label: 'Today',
            href: `/admin/schedule/${today}`,
            match: ['/admin/schedule'],
        },
    ];
}

export const adminSubNav: ModeSubNavItem[] = [
    { label: 'Settings', href: '/admin/settings' },
    { label: 'Health', href: '/admin/health', match: ['/admin/health'] },
    { label: 'Runbook', href: '/admin/runbook', match: ['/admin/runbook'] },
    { label: 'Audit', href: '/admin/audit', match: ['/admin/audit'] },
    { label: 'Capture', href: '/admin/output', match: ['/admin/output'] },
];
