import {
    BadgeDollarSign,
    Boxes,
    Cable,
    Cpu,
    Factory,
    Monitor,
    Network,
    ShieldCheck,
    Store,
    TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';

const howItWorks = [
    {
        title: '1. Tenant',
        body: 'El super admin crea vendors. Cada vendor ve solo sus pantallas, assets, musica y playlists.',
    },
    {
        title: '2. Contenido',
        body: 'El vendor sube imagenes/videos, agrega YouTube, Vimeo publico o URLs publicas de imagen/video.',
    },
    {
        title: '3. Aprobacion',
        body: 'El vendor arma playlists horizontales o verticales y las envia. El super admin aprueba antes de live.',
    },
    {
        title: '4. Player',
        body: 'Cada pantalla abre una URL fullscreen. El player pide estado, reproduce el asset activo y usa fallback si algo falla.',
    },
];

const stack = [
    ['App', 'Next.js App Router, React, TypeScript, Tailwind, Lucide'],
    ['Data', 'Cloudflare D1 / SQLite via Drizzle ORM'],
    ['Media', 'R2-compatible object storage, public media proxy and remote URLs'],
    ['Runtime', 'Node standalone service behind digsign.diegodella.ar'],
    ['Security', 'Operator sessions, roles, CSRF, output token, audit trail'],
    ['Output', 'Browser player per screen, API state polling, media fallback'],
];

const businessModel = [
    {
        title: 'SaaS por vendor',
        body: 'Cobro mensual por vendor activo, con limites por pantallas, storage y soporte.',
    },
    {
        title: 'Pantallas como unidad',
        body: 'Pricing escalable por cantidad de pantallas activas. Es el driver mas claro de valor.',
    },
    {
        title: 'Setup e implementacion',
        body: 'Fee inicial por configuracion, migracion de contenidos, hardware y capacitacion.',
    },
    {
        title: 'Servicios gestionados',
        body: 'Opcional: operacion de playlists, monitoreo, diseno de piezas y soporte prioritario.',
    },
];

const screenTypes = [
    {
        title: 'Indoor',
        icon: Store,
        body: 'Locales, recepciones, gimnasios, restaurantes, oficinas y shoppings.',
        needs: ['TV o monitor comercial', 'Mini PC / Android player', 'Wi-Fi o Ethernet estable'],
        risks: ['Brillo bajo con luz directa', 'Audio bloqueado por navegador', 'Cortes de Wi-Fi'],
    },
    {
        title: 'Outdoor',
        icon: Factory,
        body: 'Carteleria exterior, vidrieras muy iluminadas, eventos y pantallas LED.',
        needs: [
            'Pantalla de alto brillo o LED',
            'Gabinete/weatherproof si aplica',
            'Player ventilado y UPS',
        ],
        risks: ['Calor', 'Reflejos', 'Consumo electrico', 'Red movil inestable'],
    },
];

const hardware = [
    {
        title: 'Basico',
        body: 'TV + Android box o mini PC. Sirve para pilotos indoor con video simple.',
    },
    {
        title: 'Recomendado',
        body: 'Mini PC fanless, Chromium kiosk, Ethernet, auto-start y watchdog de servicio.',
    },
    {
        title: 'Robusto',
        body: 'Player industrial, UPS, red cableada, monitoreo remoto y gabinete termico.',
    },
];

const issues = [
    {
        kind: 'Encontrado',
        problem: 'Playlist lista pero no segura para live',
        solution:
            'Se agrego approval_state. Solo approved + ready + items puede asignarse o renderizarse.',
    },
    {
        kind: 'Encontrado',
        problem: 'Vendors podian mezclarse conceptualmente',
        solution:
            'Modelo vendor_id en assets, screens, playlists y musica. El scope se aplica en lecturas y escrituras.',
    },
    {
        kind: 'Encontrado',
        problem: 'Pantallas verticales y horizontales necesitaban loops separados',
        solution: 'Orientation en screens y playlists. La asignacion valida que coincidan.',
    },
    {
        kind: 'Hipotetico',
        problem: 'Player queda negro por asset remoto caido',
        solution:
            'Fallback playlist obligatoria, health monitor, proxy de media y alerta de no-playable-items.',
    },
    {
        kind: 'Hipotetico',
        problem: 'Corte de internet en local',
        solution:
            'Cache local futuro en player, contenido critico predescargado y alerta por heartbeat perdido.',
    },
    {
        kind: 'Hipotetico',
        problem: 'Outdoor se apaga por temperatura o energia',
        solution: 'UPS, player industrial, gabinete ventilado y monitoreo de uptime por pantalla.',
    },
];

export default function BusinessPage() {
    return (
        <main className="min-h-screen bg-surface-elevated-1 text-ink">
            <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
                <header className="border-2 border-line bg-surface p-6 shadow-[8px_8px_0_#1a1a1a] md:p-8">
                    <div className="flex flex-wrap gap-3">
                        <Link href="/" className="btn-secondary">
                            Back
                        </Link>
                        <Link href="/manual" className="btn-secondary">
                            Manual
                        </Link>
                    </div>
                    <p className="eyebrow mt-8 text-accent-live">DigSign System</p>
                    <h1 className="mt-3 max-w-5xl font-display text-5xl font-bold uppercase leading-none md:text-7xl">
                        Stack Tecnologico y Modelo de Negocio
                    </h1>
                    <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-muted">
                        Pagina de referencia para explicar como funciona DigSign, que hardware
                        necesita, como se podria cobrar y donde estan los riesgos operativos.
                    </p>
                </header>

                <section className="mt-8 grid gap-4 md:grid-cols-4">
                    {howItWorks.map((item) => (
                        <article key={item.title} className="surface-card p-5">
                            <Network size={26} aria-hidden="true" />
                            <h2 className="mt-4 font-display text-xl font-bold uppercase">
                                {item.title}
                            </h2>
                            <p className="mt-3 text-sm font-medium leading-6 text-muted">
                                {item.body}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
                    <div>
                        <div className="flex items-center gap-3">
                            <Cpu size={26} aria-hidden="true" />
                            <h2 className="font-display text-3xl font-bold uppercase">
                                Stack Tecnologico
                            </h2>
                        </div>
                        <div className="mt-5 overflow-hidden border-2 border-line bg-surface shadow-[6px_6px_0_#1a1a1a]">
                            {stack.map(([layer, detail]) => (
                                <div
                                    key={layer}
                                    className="grid gap-2 border-b-2 border-line p-4 last:border-b-0 md:grid-cols-[160px_1fr]"
                                >
                                    <p className="font-headline text-xs font-bold uppercase text-muted">
                                        {layer}
                                    </p>
                                    <p className="text-sm font-semibold leading-6">{detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="border-2 border-line bg-surface-selected-positive p-5 shadow-[6px_6px_0_#1a1a1a]">
                        <BadgeDollarSign size={30} aria-hidden="true" />
                        <h2 className="mt-4 font-display text-3xl font-bold uppercase">
                            Modelo de Negocio
                        </h2>
                        <div className="mt-5 grid gap-3">
                            {businessModel.map((item) => (
                                <section key={item.title} className="border-l-4 border-line pl-3">
                                    <h3 className="font-display text-lg font-bold uppercase">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium leading-6">
                                        {item.body}
                                    </p>
                                </section>
                            ))}
                        </div>
                    </aside>
                </section>

                <section className="mt-10">
                    <div className="flex items-center gap-3">
                        <Monitor size={26} aria-hidden="true" />
                        <h2 className="font-display text-3xl font-bold uppercase">
                            Tipos de Pantalla
                        </h2>
                    </div>
                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                        {screenTypes.map((type) => (
                            <article key={type.title} className="surface-card p-5">
                                <type.icon size={30} aria-hidden="true" />
                                <h3 className="mt-4 font-display text-2xl font-bold uppercase">
                                    {type.title}
                                </h3>
                                <p className="mt-2 text-sm font-medium leading-6 text-muted">
                                    {type.body}
                                </p>
                                <ListBlock title="Necesita" items={type.needs} />
                                <ListBlock title="Riesgos" items={type.risks} />
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex items-center gap-3">
                        <Cable size={26} aria-hidden="true" />
                        <h2 className="font-display text-3xl font-bold uppercase">
                            Hardware Necesario
                        </h2>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {hardware.map((tier) => (
                            <article key={tier.title} className="surface-card p-5">
                                <Boxes size={26} aria-hidden="true" />
                                <h3 className="mt-4 font-display text-xl font-bold uppercase">
                                    {tier.title}
                                </h3>
                                <p className="mt-3 text-sm font-medium leading-6 text-muted">
                                    {tier.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex items-center gap-3">
                        <TriangleAlert size={26} aria-hidden="true" />
                        <h2 className="font-display text-3xl font-bold uppercase">
                            Problemas y Soluciones
                        </h2>
                    </div>
                    <div className="mt-5 grid gap-3">
                        {issues.map((issue) => (
                            <article
                                key={`${issue.kind}-${issue.problem}`}
                                className="grid gap-3 border-2 border-line bg-surface p-4 shadow-[3px_3px_0_#1a1a1a] lg:grid-cols-[120px_1fr_1fr]"
                            >
                                <p className="font-headline text-xs font-bold uppercase text-accent-live">
                                    {issue.kind}
                                </p>
                                <div>
                                    <p className="font-headline text-xs font-bold uppercase text-muted">
                                        Problema
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-6">
                                        {issue.problem}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-headline text-xs font-bold uppercase text-muted">
                                        Solucion
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-6">
                                        {issue.solution}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10 border-2 border-line bg-surface p-5 shadow-[6px_6px_0_#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={28} aria-hidden="true" />
                        <h2 className="font-display text-2xl font-bold uppercase">
                            Regla de Producto
                        </h2>
                    </div>
                    <p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-muted">
                        DigSign no compite por ser un editor creativo generico. Compite por operar
                        redes de pantallas con menos riesgo: vendors aislados, aprobacion central,
                        orientacion correcta, fallback visible y salida browser simple.
                    </p>
                </section>
            </div>
        </main>
    );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="mt-5">
            <p className="font-headline text-xs font-bold uppercase text-muted">{title}</p>
            <ul className="mt-2 grid gap-2 text-sm font-semibold">
                {items.map((item) => (
                    <li key={item} className="border-l-4 border-line pl-3">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
