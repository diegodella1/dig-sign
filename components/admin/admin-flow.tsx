import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ClearStateBadge } from '@/components/ui';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type FlowTone = 'prepare' | 'program' | 'operate' | 'neutral' | 'warn';

export function FlowHero({
    eyebrow,
    title,
    detail,
    children,
}: {
    eyebrow: string;
    title: string;
    detail: ReactNode;
    children?: ReactNode;
}) {
    return (
        <section className="mb-5 border-2 border-line bg-surface-elevated-2 p-5 shadow-[4px_4px_0_#1a1a1a]">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-4xl">
                    <p className="eyebrow text-accent-positive">{eyebrow}</p>
                    <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-normal md:text-4xl">
                        {title}
                    </h2>
                    <div className="mt-2 text-sm font-medium leading-6 text-muted">{detail}</div>
                </div>
                {children ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
                ) : null}
            </div>
        </section>
    );
}

export function FlowLinkList({
    items,
}: {
    items: Array<{
        href: string;
        label: string;
        badge?: string;
        tone?: 'neutral' | 'warn';
    }>;
}) {
    return (
        <nav className="surface-panel divide-y-2 divide-line overflow-hidden">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-panel-soft"
                >
                    <span className="font-headline font-bold uppercase">{item.label}</span>
                    {item.badge ? (
                        <ClearStateBadge tone={item.tone === 'warn' ? 'warn' : 'info'}>
                            {item.badge}
                        </ClearStateBadge>
                    ) : (
                        <ArrowRight size={14} className="shrink-0 text-muted" aria-hidden="true" />
                    )}
                </Link>
            ))}
        </nav>
    );
}

export function FlowGrid({ children }: { children: ReactNode }) {
    return <section className="grid gap-3 xl:grid-cols-3">{children}</section>;
}

export function FlowCard({
    href,
    icon: Icon,
    label,
    title,
    detail,
    tone = 'neutral',
    badge,
}: {
    href: string;
    icon: LucideIcon;
    label: string;
    title: string;
    detail: ReactNode;
    tone?: FlowTone;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className={clsx(
                'group flex min-h-[12rem] flex-col justify-between border-2 p-4 shadow-[4px_4px_0_#1a1a1a] transition hover:-translate-x-1 hover:-translate-y-1 hover:bg-panel-soft hover:shadow-[6px_6px_0_#1a1a1a]',
                toneClass(tone),
            )}
        >
            <span>
                <span className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center border-2 border-line bg-surface text-muted">
                        <Icon size={19} aria-hidden="true" />
                    </span>
                    {badge ? (
                        <ClearStateBadge tone={tone === 'warn' ? 'warn' : 'info'}>
                            {badge}
                        </ClearStateBadge>
                    ) : null}
                </span>
                <span className="mt-4 block font-headline text-[0.68rem] font-bold uppercase text-muted">
                    {label}
                </span>
                <span className="mt-2 block font-display text-xl font-bold uppercase text-ink">
                    {title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted">{detail}</span>
            </span>
            <span className="mt-5 inline-flex items-center gap-2 font-headline text-sm font-bold uppercase text-info">
                Open
                <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition group-hover:translate-x-0.5"
                />
            </span>
        </Link>
    );
}

export function FlowRail({
    title,
    items,
}: {
    title: string;
    items: Array<{ label: string; value: string; tone?: 'ok' | 'warn' | 'danger' | 'neutral' }>;
}) {
    return (
        <section className="surface-panel p-4">
            <h2 className="font-semibold">{title}</h2>
            <div className="mt-4 grid gap-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex min-h-12 items-center justify-between gap-3 border-2 border-line bg-surface px-3 py-2 text-sm"
                    >
                        <span className="font-headline font-bold uppercase text-muted">
                            {item.label}
                        </span>
                        <span
                            className={clsx(
                                'truncate font-semibold',
                                railTone(item.tone ?? 'neutral'),
                            )}
                        >
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function toneClass(tone: FlowTone) {
    switch (tone) {
        case 'prepare':
            return 'border-info-line bg-info-soft';
        case 'program':
            return 'border-accent-positive bg-surface-selected-positive';
        case 'operate':
            return 'border-danger-line bg-danger-soft';
        case 'warn':
            return 'border-warn-line bg-warn-soft';
        default:
            return 'border-line bg-surface';
    }
}

function railTone(tone: 'ok' | 'warn' | 'danger' | 'neutral') {
    switch (tone) {
        case 'ok':
            return 'text-success';
        case 'warn':
            return 'text-warn';
        case 'danger':
            return 'text-danger';
        default:
            return 'text-ink';
    }
}
