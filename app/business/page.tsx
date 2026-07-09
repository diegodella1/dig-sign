import {
    BadgeDollarSign,
    Building2,
    CheckCircle2,
    Clapperboard,
    MonitorPlay,
    PlayCircle,
    ShieldCheck,
    Store,
    UploadCloud,
} from 'lucide-react';
import Link from 'next/link';

const outcomes = [
    'Tus locales cambian promociones sin pendrives ni visitas tecnicas.',
    'Cada vendor carga contenido, pero nada sale en vivo sin aprobacion.',
    'Las pantallas verticales y horizontales usan playlists separadas para evitar piezas mal encuadradas.',
];

const useCases = [
    {
        title: 'Locales y franquicias',
        body: 'Promos por sucursal, menu boards, novedades y campañas de temporada con control central.',
        icon: Store,
    },
    {
        title: 'Agencias y operadores',
        body: 'Varios clientes en un solo panel, cada uno aislado por vendor y con aprobaciones claras.',
        icon: Building2,
    },
    {
        title: 'Redes de pantallas',
        body: 'Player por URL, playlists por orientacion, fallback y monitoreo para saber que esta saliendo.',
        icon: MonitorPlay,
    },
];

const flow = [
    {
        title: '1. Cargas pantallas',
        body: 'Creas cada pantalla con nombre, ubicacion, orientacion y URL de player.',
        icon: MonitorPlay,
    },
    {
        title: '2. Subis contenido',
        body: 'Videos, imagenes, YouTube, URLs publicas, placas y musica quedan en una biblioteca del vendor.',
        icon: UploadCloud,
    },
    {
        title: '3. Armas playlist',
        body: 'Separas loops verticales 9:16 y horizontales 16:9 antes de enviarlos a aprobacion.',
        icon: Clapperboard,
    },
    {
        title: '4. Sale en vivo',
        body: 'El superadmin aprueba, asigna a pantallas compatibles y el browser player reproduce fullscreen.',
        icon: PlayCircle,
    },
];

const pricing = [
    'Plan por vendor activo',
    'Cargo por cantidad de pantallas',
    'Setup inicial de hardware y contenidos',
    'Servicio gestionado opcional',
];

const objections = [
    {
        question: 'Que pasa si un vendor sube contenido incorrecto?',
        answer: 'La playlist queda en draft o enviada. El superadmin aprueba antes de que pueda asignarse a una pantalla.',
    },
    {
        question: 'Sirve para pantallas verticales?',
        answer: 'Si. DigSign separa playlists verticales 9:16 y horizontales 16:9 para reducir errores de formato.',
    },
    {
        question: 'Necesito una app instalada en cada TV?',
        answer: 'No para el piloto. Cada pantalla abre una URL fullscreen en el browser del player.',
    },
];

export default function BusinessPage() {
    return (
        <main className="min-h-screen bg-surface-elevated-1 text-ink">
            <section className="mx-auto grid min-h-[92vh] max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_430px]">
                <div className="flex flex-col justify-between border-2 border-line bg-surface p-6 shadow-[8px_8px_0_#1a1a1a] md:p-8">
                    <header>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/" className="btn-secondary">
                                DigSign
                            </Link>
                            <Link href="/admin/login" className="btn-secondary">
                                Login
                            </Link>
                        </div>
                        <p className="eyebrow mt-10 text-accent-live">
                            Digital signage para redes comerciales
                        </p>
                        <h1 className="mt-3 max-w-5xl font-display text-5xl font-bold uppercase leading-none md:text-7xl">
                            Controla todas tus pantallas desde un panel simple
                        </h1>
                        <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-muted">
                            DigSign ayuda a marcas, franquicias y agencias a operar pantallas en
                            varios locales: cada vendor carga contenido, el superadmin aprueba y el
                            player muestra la playlist correcta en vivo.
                        </p>
                    </header>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link className="btn-primary" href="/admin/login">
                            Ver panel operativo
                        </Link>
                        <a className="btn-secondary" href="#como-funciona">
                            Ver como funciona
                        </a>
                    </div>
                </div>

                <aside className="grid content-start gap-4">
                    <div className="surface-card bg-surface-selected-positive p-5">
                        <MonitorPlay size={34} aria-hidden="true" />
                        <h2 className="mt-4 font-display text-2xl font-bold uppercase">
                            De contenido a pantalla, sin caos operativo
                        </h2>
                        <div className="mt-5 grid gap-3">
                            {outcomes.map((item) => (
                                <div key={item} className="flex gap-3 border-l-4 border-line pl-3">
                                    <CheckCircle2
                                        size={18}
                                        className="mt-1 shrink-0 text-success"
                                        aria-hidden="true"
                                    />
                                    <p className="text-sm font-semibold leading-6">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="surface-card overflow-hidden bg-ink text-white">
                        <div className="border-b-2 border-white/30 p-4">
                            <p className="eyebrow text-white/70">Vista del operador</p>
                            <p className="mt-1 font-display text-xl font-bold uppercase">
                                Pantallas, assets, playlist, aprobacion, live
                            </p>
                        </div>
                        <div className="grid gap-2 p-4">
                            {['Pantallas asignadas', 'Contenido listo', 'Playlist aprobada'].map(
                                (item) => (
                                    <div
                                        key={item}
                                        className="flex items-center justify-between border-2 border-white/40 bg-white px-3 py-2 text-ink"
                                    >
                                        <span className="font-headline text-xs font-bold uppercase">
                                            {item}
                                        </span>
                                        <span className="border-2 border-line bg-surface-selected-positive px-2 py-1 text-[10px] font-bold uppercase">
                                            OK
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </aside>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8" id="como-funciona">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={28} aria-hidden="true" />
                    <h2 className="font-display text-3xl font-bold uppercase">
                        Para quien es DigSign
                    </h2>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    {useCases.map((item) => (
                        <article key={item.title} className="surface-card p-5">
                            <item.icon size={30} aria-hidden="true" />
                            <h3 className="mt-4 font-display text-2xl font-bold uppercase">
                                {item.title}
                            </h3>
                            <p className="mt-3 text-sm font-medium leading-6 text-muted">
                                {item.body}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                    <div>
                        <h2 className="font-display text-3xl font-bold uppercase">
                            Como se opera una red de pantallas
                        </h2>
                        <div className="mt-5 grid gap-4">
                            {flow.map((item) => (
                                <article
                                    key={item.title}
                                    className="grid gap-4 border-2 border-line bg-surface p-4 shadow-[4px_4px_0_#1a1a1a] md:grid-cols-[48px_1fr]"
                                >
                                    <div className="grid h-12 w-12 place-items-center border-2 border-line bg-surface-selected-positive">
                                        <item.icon size={24} aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="font-display text-xl font-bold uppercase">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-sm font-medium leading-6 text-muted">
                                            {item.body}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="surface-card bg-surface-selected-positive p-5">
                        <BadgeDollarSign size={32} aria-hidden="true" />
                        <h2 className="mt-4 font-display text-3xl font-bold uppercase">
                            Como se vende
                        </h2>
                        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                            Modelo simple para pilotos y crecimiento: cobras por vendor, por
                            pantalla y por setup. Si el cliente no quiere operar, sumas servicio
                            gestionado.
                        </p>
                        <ul className="mt-5 grid gap-2 text-sm font-bold">
                            {pricing.map((item) => (
                                <li key={item} className="border-l-4 border-line pl-3">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </aside>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-8">
                <h2 className="font-display text-3xl font-bold uppercase">
                    Objeciones normales antes de comprar
                </h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    {objections.map((item) => (
                        <article key={item.question} className="surface-card p-5">
                            <h3 className="font-display text-xl font-bold uppercase">
                                {item.question}
                            </h3>
                            <p className="mt-3 text-sm font-medium leading-6 text-muted">
                                {item.answer}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 pb-12 pt-6">
                <div className="border-2 border-line bg-ink p-6 text-white shadow-[8px_8px_0_#ffcc00] md:p-8">
                    <h2 className="font-display text-4xl font-bold uppercase">
                        Piloto rapido: una marca, dos pantallas, una semana de contenido
                    </h2>
                    <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/75">
                        Suficiente para mostrar el valor: cargar piezas, aprobarlas, asignarlas y
                        verlas salir en una pantalla real.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/admin/login" className="btn-primary">
                            Entrar al panel
                        </Link>
                        <Link href="/manual" className="btn-secondary">
                            Ver manual
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
