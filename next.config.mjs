import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    poweredByHeader: false,
    experimental: {
        middlewareClientMaxBodySize: '100mb',
    },
    async redirects() {
        return [
            { source: '/admin/program', destination: '/admin/screens', permanent: false },
            { source: '/admin/program/:path*', destination: '/admin/screens', permanent: false },
            { source: '/admin/calendar', destination: '/admin/screens', permanent: false },
            { source: '/admin/schedule/:path*', destination: '/admin/playlists', permanent: false },
            { source: '/admin/runbook', destination: '/admin/operate', permanent: false },
            { source: '/admin/runbook/:path*', destination: '/admin/operate', permanent: false },
            { source: '/admin/output', destination: '/admin/operate', permanent: false },
            { source: '/admin/prepare/gap-fill', destination: '/admin/playlists', permanent: false },
            { source: '/live', destination: '/output/live/main', permanent: false },
            { source: '/output/preview/:path*', destination: '/output/live/main', permanent: false },
        ];
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**.vimeocdn.com' },
            { protocol: 'https', hostname: '**.supabase.co' },
            { protocol: 'http', hostname: '127.0.0.1' },
            { protocol: 'http', hostname: 'localhost' },
        ],
    },
};

export default withNextIntl(nextConfig);
