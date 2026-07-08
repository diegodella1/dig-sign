import { BrowserOutputRenderer } from '@/components/output/browser-output-renderer';
import { EmergencyOutputStub } from '@/components/output/output-stub';
import { isOutputRequestAllowed, outputAccessDeniedReason } from '@/lib/auth/output-auth';

export default async function OutputLiveScreenPage({
    params,
    searchParams,
}: {
    params: Promise<{ screenSlug: string }>;
    searchParams: Promise<{ debug?: string; startAt?: string; token?: string }>;
}) {
    const [{ screenSlug }, query] = await Promise.all([params, searchParams]);

    if (!(await isOutputRequestAllowed(query))) {
        return <EmergencyOutputStub reason={outputAccessDeniedReason()} />;
    }

    const startAt = query.startAt ? Number(query.startAt) : null;

    return (
        <BrowserOutputRenderer
            debug={query.debug === 'true'}
            startAt={Number.isFinite(startAt) ? startAt : null}
            token={query.token}
            screen={screenSlug}
        />
    );
}
