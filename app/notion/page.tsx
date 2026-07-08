import Link from 'next/link';
import type { ReactNode } from 'react';

const shipped = [
    'Single-tenant operator console for Dig-Sign',
    'Named operators, admin sessions and role guards',
    'Rate limiting, CSRF protection and output token flow',
    'Admin health checks and Go Live Drill',
    'Daily schedule builder with schedule health polling',
    'Unified Prepare, Program and Operate operator hubs',
    'Schedule add-block confirmation with highlighted placement and readable time ranges',
    'Loop Builder for scheduled slide loops, visual fallback carousel, or both',
    'Runbook for preflight, live operation, incident notes and shutdown',
    'Output overrides for urgent live cuts',
    'Music playlists for slides, images and visual fallbacks',
    'Open-Meteo weather fallback when OpenWeather is not configured',
    'Browser output for OBS/vMix capture',
    'Previously Recorded bug for normal video blocks with four-corner placement',
    'Browser output confirmed in web player, vMix and OBS',
    'Public media proxy for uploaded ads/promos',
    'Time-accurate video reload resume',
    'Audit identity for critical operations',
    'Persisted smoke status for deploy/read-only smoke checks',
    'OpenNext/Cloudflare Workers deploy path configured',
];

const verification = [
    'typecheck passed',
    'lint passed',
    'format check passed',
    'i18n check passed',
    'security service-role guard passed',
    'audit trail guard passed',
    'Vitest passed',
    'Next production build passed',
    'local read-only smoke passed',
];

const nextSteps = [
    'Provision day-to-day named operators and keep bootstrap token as emergency-only access.',
    'Remodel the visual design of cards, plates and output surfaces for a final display identity.',
    'Add output drift monitoring and incident prompts for silence, black output and stalled video.',
    'Finish i18n and validation copy cleanup.',
    'Smoke-test a real OpenNext/Cloudflare Workers deploy before making it production-primary.',
];

const operationSteps = [
    {
        name: '1. Prepare content',
        route: '/admin/prepare',
        actions: [
            'Upload videos, images, audio and graphics from the Prepare hub.',
            'Sync Vimeo or open the direct Vimeo route from Prepare.',
            'Register remote URLs when needed.',
            'Create weather city plates and custom plates before scheduling.',
            'Mark assets as ready only after reviewing playback, duration and fallback.',
        ],
    },
    {
        name: '2. Program the day',
        route: '/admin/screens',
        actions: [
            'Create or open the schedule day.',
            'Add blocks in chronological order from Schedule.',
            'Use Loop Builder for silent slide loops.',
            'Choose scheduled loop, fallback carousel only, or both.',
            'Assign an asset, slide or live stream.',
        ],
    },
    {
        name: '3. Build playlists',
        route: '/admin/playlists',
        actions: [
            'Create content playlists with plates and media.',
            'Assign playlists to screens by date range.',
            'Set a fallback playlist per screen when nothing is scheduled.',
        ],
    },
    {
        name: '4. Monitor output',
        route: '/admin/operate',
        actions: [
            'Review each screen monitor tile.',
            'Confirm the active playlist and current item.',
            'Use health checks before opening hours.',
        ],
    },
    {
        name: '5. Go live',
        route: '/admin/operate',
        actions: [
            'Activate the correct day.',
            'Open Output from Operate.',
            'Open Browser Output.',
            'Click Start Output once to unlock audio.',
            'Capture the browser or window in OBS/vMix.',
            'Confirm that the monitor shows the expected current block and next block.',
        ],
    },
    {
        name: '6. Operate during live',
        route: '/admin/operate',
        actions: [
            'Monitor current block, next block, fallback reason, playlist/audio state and playback errors.',
            'Use live override only when the output must cut immediately to a dynamic endpoint.',
            'Return to schedule when the override ends.',
        ],
    },
    {
        name: '7. Stop playback',
        route: '/admin/operate',
        actions: [
            'Use Stop output.',
            'Confirm that active overrides are cleared.',
            'Complete shutdown checks.',
            'Review the audit log.',
        ],
    },
];

const preAirChecks = [
    '/api/health returns ok:true.',
    'Schema/migrations OK.',
    'Storage OK.',
    'Vimeo token/playback ready.',
    'OUTPUT_CAPTURE_TOKEN configured.',
    'Browser output opens on the capture machine.',
    'Start Output unlocks audio.',
    'Reload mid-video resumes near the expected schedule offset.',
    'Slide output renders in the capture runtime.',
    'Fallback defined.',
    'Runbook preflight complete.',
];

const releaseGates = [
    'npm run typecheck',
    'npm run lint',
    'npm run format:check',
    'npm run i18n:check',
    'npm run security:service-role',
    'npm run security:audit-trail',
    'npm test',
    'npm run build',
    'bash scripts/local_readonly_smoke.sh',
    'bash scripts/prod_readonly_smoke.sh',
];

export default function NotionStatusPage() {
    const h2Class = 'mt-8 text-2xl font-semibold tracking-normal text-[#2f2f2b]';
    const h3Class = 'mt-6 text-xl font-semibold tracking-normal text-[#2f2f2b]';
    const listClass = 'list-disc space-y-1 pl-6';
    const numberListClass = 'list-decimal space-y-1 pl-6';
    const codeClass = 'rounded bg-[#f1f1ef] px-1 py-0.5 font-mono text-[0.9em] text-[#eb5757]';

    return (
        <main className="min-h-screen bg-[#fbfbfa] text-[#37352f]">
            <div className="mx-auto max-w-[820px] px-6 py-10 md:py-14">
                <nav className="mb-10 flex gap-4 text-sm text-[#6b6b63]">
                    <Link
                        className="underline decoration-[#d3d1cb] underline-offset-4"
                        href="/pending"
                    >
                        Pending/Gantt
                    </Link>
                    <Link
                        className="underline decoration-[#d3d1cb] underline-offset-4"
                        href="/manual"
                    >
                        Full manual
                    </Link>
                </nav>

                <article className="space-y-12 rounded-sm bg-[#fbfbfa] text-[16px] leading-7">
                    <section className="space-y-5">
                        <div className="text-6xl leading-none">🖥️</div>
                        <p className="text-sm font-medium text-[#787774]">Dig-Sign</p>
                        <h1 className="text-4xl font-bold leading-tight tracking-[-0.01em] text-[#2f2f2b] md:text-5xl">
                            Dig-Sign status
                        </h1>

                        <Callout>
                            Status: <strong>production ready.</strong> Ready for controlled operation
                            with an operator present. Browser output has been confirmed in web
                            player, vMix and OBS. The main remaining product gate is final plate
                            design plus stronger output alerts.
                        </Callout>

                        <h2 className={h2Class}>Current status</h2>
                        <p>
                            Dig-Sign is the control room for scheduled digital signage. It gives
                            operators one place to prepare content, program the daily rundown, check
                            schedule risk, run preflight and send browser output into OBS or vMix.
                        </p>
                        <p>
                            The admin workflow is grouped by intent: Prepare for content and plates,
                            Program for day/rundown/loop/fallback work and Operate for live output,
                            health, runbook and recovery.
                        </p>

                        <h2 className={h2Class}>Operator map</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-y border-[#e9e7e3] text-left text-[#787774]">
                                        <th className="py-2 pr-4 font-medium">Hub</th>
                                        <th className="py-2 pr-4 font-medium">Route</th>
                                        <th className="py-2 font-medium">Use when</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[#e9e7e3] align-top">
                                        <td className="py-3 pr-4 font-medium">Prepare</td>
                                        <td className="py-3 pr-4">
                                            <code className={codeClass}>/admin/prepare</code>
                                        </td>
                                        <td className="py-3">
                                            Create media, music, weather and custom plates.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e9e7e3] align-top">
                                        <td className="py-3 pr-4 font-medium">Program</td>
                                        <td className="py-3 pr-4">
                                            <code className={codeClass}>/admin/screens</code>
                                        </td>
                                        <td className="py-3">
                                            Build the day, create loops, set fallback and fix
                                            health.
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e9e7e3] align-top">
                                        <td className="py-3 pr-4 font-medium">Operate</td>
                                        <td className="py-3 pr-4">
                                            <code className={codeClass}>/admin/operate</code>
                                        </td>
                                        <td className="py-3">
                                            Run output, unlock audio, monitor fallback and recover
                                            live.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p>
                            The workflow is browser-output-first: the operator opens Browser Output
                            from Admin Output, clicks Start Output once to unlock audio and captures
                            the page in OBS/vMix. Reload recovery seeks video to the current
                            scheduled offset so the signal can resume near the correct moment.
                        </p>

                        <h2 className={h2Class}>Implemented and applied</h2>
                        <ul className={listClass}>
                            {shipped.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <h2 className={h2Class}>Production verification</h2>
                        <ul className={listClass}>
                            {verification.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <h2 className={h2Class}>Next steps</h2>
                        <ol className={numberListClass}>
                            {nextSteps.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ol>
                    </section>

                    <hr className="border-[#e9e7e3]" />

                    <section className="space-y-5">
                        <div className="text-6xl leading-none">🎛️</div>
                        <h1 className="text-4xl font-bold leading-tight tracking-[-0.01em] text-[#2f2f2b] md:text-5xl">
                            Operations manual
                        </h1>

                        <h2 className={h2Class}>Objective</h2>
                        <p>
                            Dig-Sign turns a daily signage plan into an operator-run signal: media
                            library, schedule, runbook, fallbacks, live monitor and fullscreen
                            browser output.
                        </p>

                        <h2 className={h2Class}>Standard workflow</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-y border-[#e9e7e3] text-left text-[#787774]">
                                        <th className="py-2 pr-4 font-medium">Step</th>
                                        <th className="py-2 pr-4 font-medium">Route</th>
                                        <th className="py-2 font-medium">Primary action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operationSteps.map((step) => (
                                        <tr
                                            key={step.name}
                                            className="border-b border-[#e9e7e3] align-top"
                                        >
                                            <td className="py-3 pr-4 font-medium">{step.name}</td>
                                            <td className="py-3 pr-4">
                                                <code className={codeClass}>{step.route}</code>
                                            </td>
                                            <td className="py-3">{step.actions[0]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {operationSteps.map((step) => (
                            <section key={step.name} className="space-y-2">
                                <h3 className={h3Class}>{step.name}</h3>
                                <p>
                                    <strong>Route:</strong>{' '}
                                    <code className={codeClass}>{step.route}</code>
                                </p>
                                <p>
                                    <strong>Actions:</strong>
                                </p>
                                <ul className={listClass}>
                                    {step.actions.map((action) => (
                                        <li key={action}>{action}</li>
                                    ))}
                                </ul>
                            </section>
                        ))}

                        <h2 className={h2Class}>Operating rules</h2>
                        <ul className={listClass}>
                            <li>Browser output is the primary output surface.</li>
                            <li>
                                OBS/vMix captures `/output/live`; operators click Start Output to
                                unlock audio.
                            </li>
                            <li>The bootstrap token remains for emergency access.</li>
                            <li>Normal operation must use named operators.</li>
                            <li>Critical changes must appear in the audit log.</li>
                            <li>
                                Do not go live with critical schedule health issues without an
                                explicit decision.
                            </li>
                        </ul>

                        <h2 className={h2Class}>Pre-air checks</h2>
                        <ul className={listClass}>
                            {preAirChecks.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>

                        <h2 className={h2Class}>Verification commands</h2>
                        <ul className={listClass}>
                            {releaseGates.map((gate) => (
                                <li key={gate}>
                                    <code className={codeClass}>{gate}</code>
                                </li>
                            ))}
                        </ul>
                    </section>
                </article>
            </div>
        </main>
    );
}

function Callout({ children }: { children: ReactNode }) {
    return (
        <div className="flex gap-3 rounded-sm bg-[#f1f1ef] px-4 py-3 text-[#37352f]">
            <span aria-hidden="true">✅</span>
            <p>{children}</p>
        </div>
    );
}
