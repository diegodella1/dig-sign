import defaultTheme from 'tailwindcss/defaultTheme';

import type { Config } from 'tailwindcss';

// Bauhaus neo-brutalist admin palette. Output/player surfaces still use
// explicit black classes where they need broadcast-safe darkness.
const config: Config = {
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
                headline: ['var(--font-space-grotesk)', ...defaultTheme.fontFamily.sans],
                display: ['var(--font-space-grotesk)', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                ink: '#1a1a1a',
                muted: '#4a4a4a',
                panel: '#ffffff',
                'panel-soft': '#f2ede5',
                surface: '#faf7f2',
                line: '#1a1a1a',
                'line-strong': '#1a1a1a',
                signal: '#ffcc00',
                warn: '#ff9900',
                'warn-soft': '#fff0c2',
                'warn-line': '#1a1a1a',
                'warn-strong': '#1a1a1a',
                danger: '#cc0000',
                'danger-soft': '#ffdad6',
                'danger-line': '#1a1a1a',
                'danger-strong': '#93000a',
                success: '#00a85a',
                'success-soft': '#dff7e9',
                'success-line': '#1a1a1a',
                'success-strong': '#1a1a1a',
                info: '#0055ff',
                'info-soft': '#d6e3ff',
                'info-line': '#1a1a1a',
                'info-strong': '#0055ff',
                'surface-elevated-1': '#f5f0e8',
                'surface-elevated-2': '#ffffff',
                'surface-selected-positive': '#ffcc00',
                'accent-positive': '#ffcc00',
                'accent-positive-hover': '#e6b800',
                'accent-positive-glow': '#1a1a1a',
                'accent-positive-glow-strong': '#1a1a1a',
                'accent-live': '#e63b2e',
                'accent-live-text': '#e63b2e',
                'info-blue': '#0055ff',
                'warn-amber': '#ff9900',
                'info-violet': '#0055ff',
                'negative-red': '#e63b2e',
            },
            boxShadow: {
                'accent-positive-glow': '4px 4px 0 0 #1a1a1a',
                'accent-positive-glow-strong': '6px 6px 0 0 #1a1a1a',
            },
        },
    },
    plugins: [],
};

export default config;
