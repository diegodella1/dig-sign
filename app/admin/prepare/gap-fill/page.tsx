import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function GapFillPage() {
    redirect('/admin/program/fallback');
}
