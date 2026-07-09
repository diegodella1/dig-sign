'use client';

import { ExternalLink, Link as LinkIcon, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

type GoogleMapsAddressHelperProps = {
    defaultLocationName?: string | null;
    defaultAddress?: string | null;
    defaultGoogleMapsUrl?: string | null;
    className?: string;
};

function mapsSearchUrl(query: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function GoogleMapsAddressHelper({
    defaultLocationName,
    defaultAddress,
    defaultGoogleMapsUrl,
    className = '',
}: GoogleMapsAddressHelperProps) {
    const [locationName, setLocationName] = useState(defaultLocationName ?? '');
    const [address, setAddress] = useState(defaultAddress ?? '');
    const [googleMapsUrl, setGoogleMapsUrl] = useState(defaultGoogleMapsUrl ?? '');

    const suggestedQuery = useMemo(
        () =>
            [locationName, address]
                .map((part) => part.trim())
                .filter(Boolean)
                .join(', '),
        [locationName, address],
    );
    const suggestedUrl = suggestedQuery ? mapsSearchUrl(suggestedQuery) : '';

    function openSuggestedSearch() {
        if (!suggestedUrl) {
            return;
        }

        window.open(suggestedUrl, '_blank', 'noopener,noreferrer');
    }

    function useSuggestedUrl() {
        if (suggestedUrl) {
            setGoogleMapsUrl(suggestedUrl);
        }
    }

    return (
        <div className={`grid gap-3 md:grid-cols-2 ${className}`}>
            <label className="grid gap-1 text-sm">
                <span className="text-muted">Place / location</span>
                <input
                    name="location_name"
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    placeholder="Lobby, branch, store"
                    className="rounded-md border border-line bg-surface px-3 py-2"
                />
            </label>
            <label className="grid gap-1 text-sm">
                <span className="text-muted">Address</span>
                <input
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Street, city, country"
                    className="rounded-md border border-line bg-surface px-3 py-2"
                />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-muted">Google Maps URL</span>
                <input
                    name="google_maps_url"
                    value={googleMapsUrl}
                    onChange={(event) => setGoogleMapsUrl(event.target.value)}
                    placeholder="Optional"
                    className="rounded-md border border-line bg-surface px-3 py-2"
                />
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                    type="button"
                    onClick={openSuggestedSearch}
                    disabled={!suggestedUrl}
                    className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <MapPin size={16} aria-hidden="true" />
                    Search Google Maps
                    <ExternalLink size={14} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={useSuggestedUrl}
                    disabled={!suggestedUrl}
                    className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LinkIcon size={16} aria-hidden="true" />
                    Use suggested URL
                </button>
            </div>
        </div>
    );
}
