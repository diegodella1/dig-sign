import Link from 'next/link';

import { StatusBadge } from '@/components/broadcast/status-badge';
import { Timecode } from '@/components/ui/timecode';
import { PlayoutTime } from '@/components/output/playout-time';
import type { UpNextBlock } from '@/components/broadcast/types';

export function UpNextQueue({ airDate, blocks }: { airDate: string; blocks: UpNextBlock[] }) {
    return (
        <section className="rounded-md border border-line bg-surface-elevated-2 p-4">
            <header className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Up next</h3>
                <StatusBadge tone={blocks.length ? 'ok' : 'warn'}>
                    {blocks.length ? `${blocks.length} queued` : 'Empty'}
                </StatusBadge>
            </header>

            {blocks.length ? (
                <ol className="mt-3 divide-y divide-line">
                    {blocks.map((block) => (
                        <li key={block.id}>
                            <Link
                                href={`/admin/schedule/${airDate}/blocks/${block.id}`}
                                className="flex items-center gap-3 py-2.5 text-sm hover:bg-panel-soft"
                            >
                                <PlayoutTime airDate={airDate} seconds={block.startTimeSeconds} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold text-ink">
                                        {block.title}
                                    </span>
                                    <span className="text-xs text-muted">
                                        <Timecode seconds={block.durationSeconds} />
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            ) : (
                <p className="mt-3 text-sm text-muted">No upcoming ready blocks on today&apos;s rundown.</p>
            )}
        </section>
    );
}
