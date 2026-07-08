import clsx from 'clsx';
import Link from 'next/link';

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';

export function MetricTile({
    label,
    value,
    detail,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    detail: string;
    tone?: Tone;
}) {
    return (
        <section className={clsx('surface-card p-5', toneBorder(tone))}>
            <p className="eyebrow">{label}</p>
            <p
                className={clsx(
                    'mt-3 font-display text-3xl font-bold tabular-nums',
                    toneText(tone),
                )}
            >
                {value}
            </p>
            <p className="mt-1 text-sm font-medium text-muted">{detail}</p>
        </section>
    );
}

export function ClearStateBadge({
    tone = 'neutral',
    children,
}: {
    tone?: Tone;
    children: ReactNode;
}) {
    return (
        <span
            className={clsx(
                'inline-flex min-h-7 items-center border-2 px-2.5 font-headline text-xs font-bold uppercase',
                stateBadgeTone(tone),
            )}
        >
            {children}
        </span>
    );
}

export function ActionHint({
    label,
    children,
    tone = 'info',
}: {
    label: string;
    children: ReactNode;
    tone?: Tone;
}) {
    return (
        <div
            className={clsx(
                'border-2 px-3 py-2 text-sm shadow-[2px_2px_0_#1a1a1a]',
                noticeTone(tone),
            )}
        >
            <p className="text-[0.68rem] font-bold uppercase">{label}</p>
            <div className="mt-1 leading-5">{children}</div>
        </div>
    );
}

export function Notice({
    tone = 'info',
    title,
    children,
}: {
    tone?: Tone;
    title?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={clsx(
                'mb-4 border-2 px-4 py-3 text-sm shadow-[3px_3px_0_#1a1a1a]',
                noticeTone(tone),
            )}
        >
            {title ? <p className="font-semibold">{title}</p> : null}
            <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
    );
}

export function StatusBanner({
    tone = 'info',
    label,
    title,
    detail,
    action,
}: {
    tone?: Tone;
    label: string;
    title: string;
    detail?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <section
            className={clsx('border-2 px-4 py-3 shadow-[3px_3px_0_#1a1a1a]', noticeTone(tone))}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold uppercase">{label}</p>
                    <h2 className="mt-1 truncate text-lg font-semibold text-ink">{title}</h2>
                    {detail ? <div className="mt-1 text-sm opacity-85">{detail}</div> : null}
                </div>
                {action ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">{action}</div>
                ) : null}
            </div>
        </section>
    );
}

export function PrimaryActionPanel({
    eyebrow,
    title,
    detail,
    action,
    secondary,
}: {
    eyebrow: string;
    title: string;
    detail: ReactNode;
    action: ReactNode;
    secondary?: ReactNode;
}) {
    return (
        <section className="mb-5 border-2 border-line bg-surface-selected-positive p-4 shadow-[4px_4px_0_#1a1a1a]">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="eyebrow text-accent-positive">{eyebrow}</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink md:text-2xl">{title}</h2>
                    <div className="mt-1 max-w-3xl text-sm leading-6 text-muted">{detail}</div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {action}
                    {secondary}
                </div>
            </div>
        </section>
    );
}

export function EmptyState({
    title,
    children,
    action,
}: {
    title: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="border-2 border-dashed border-line bg-panel-soft px-4 py-5 text-sm">
            <p className="font-semibold text-ink">{title}</p>
            <div className="mt-1 max-w-2xl text-muted">{children}</div>
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

export function FormHeader({ title, detail }: { title: string; detail: string }) {
    return (
        <div>
            <h2 className="font-headline text-base font-bold uppercase">{title}</h2>
            <p className="mt-1 text-sm text-muted">{detail}</p>
        </div>
    );
}

export function Field({
    label,
    hint,
    children,
    className,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label
            className={clsx(
                'grid gap-1 font-headline text-xs font-bold uppercase text-muted',
                className,
            )}
        >
            <span>{label}</span>
            {children}
            {hint ? (
                <span className="text-[0.7rem] font-normal leading-4 text-muted">{hint}</span>
            ) : null}
        </label>
    );
}

export function FilterLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
}) {
    return (
        <Link className={active ? 'chip-active' : 'chip'} href={href}>
            {children}
        </Link>
    );
}

export function ButtonLink({
    href,
    variant = 'primary',
    children,
}: {
    href: string;
    variant?: 'primary' | 'secondary';
    children: ReactNode;
}) {
    return (
        <Link className={variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} href={href}>
            {children}
        </Link>
    );
}

function toneBorder(tone: Tone) {
    switch (tone) {
        case 'ok':
            return 'border-success-line';
        case 'warn':
            return 'border-warn-line';
        case 'danger':
            return 'border-danger-line';
        case 'info':
            return 'border-info-line';
        default:
            return 'border-line';
    }
}

function toneText(tone: Tone) {
    switch (tone) {
        case 'ok':
            return 'text-success';
        case 'warn':
            return 'text-warn';
        case 'danger':
            return 'text-danger';
        case 'info':
            return 'text-info';
        default:
            return 'text-ink';
    }
}

function noticeTone(tone: Tone) {
    switch (tone) {
        case 'ok':
            return 'border-success-line bg-success-soft text-success-strong';
        case 'warn':
            return 'border-warn-line bg-warn-soft text-warn-strong';
        case 'danger':
            return 'border-danger-line bg-danger-soft text-danger-strong';
        default:
            return 'border-info-line bg-info-soft text-info-strong';
    }
}

function stateBadgeTone(tone: Tone) {
    switch (tone) {
        case 'ok':
            return 'border-success-line bg-success-soft text-success-strong';
        case 'warn':
            return 'border-warn-line bg-warn-soft text-warn-strong';
        case 'danger':
            return 'border-danger-line bg-danger-soft text-danger-strong';
        case 'info':
            return 'border-info-line bg-info-soft text-info-strong';
        default:
            return 'border-line bg-panel-soft text-ink';
    }
}
