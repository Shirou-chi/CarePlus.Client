export type MapPoint = { lat: number; lng: number };

export const CLINIC_POINT: MapPoint = { lat: 3.215865, lng: 101.730489 };

const cache = new Map<string, MapPoint | null>();

export const mapQuery = (address: string) => {
    const parts = address
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean);
    return (parts.length > 1 ? parts.slice(1).join(", ") : (parts[0] ?? "")).trim();
};

export const mapEmbedSrc = (point: MapPoint) => {
    const pad = 0.008;
    const bbox = [point.lng - pad, point.lat - pad, point.lng + pad, point.lat + pad].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${point.lat}%2C${point.lng}`;
};

const readPoint = (body: unknown): MapPoint | null => {
    if (!body || typeof body !== "object") return null;
    const data = (body as { data?: { latitude?: unknown; longitude?: unknown } | null }).data;
    if (!data || typeof data.latitude !== "number" || typeof data.longitude !== "number") return null;
    return { lat: data.latitude, lng: data.longitude };
};

export const locateAddress = async (address: string): Promise<MapPoint | null> => {
    const query = mapQuery(address);
    if (!query) return null;
    if (cache.has(query)) return cache.get(query) ?? null;

    let point: MapPoint | null = null;
    try {
        const token = localStorage.getItem("careplus-token");
        if (token) {
            const response = await fetch(`/api/MedicineOrder/Locate?address=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) point = readPoint(await response.json());
        }
    } catch {
        point = null;
    }

    if (!point) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=my&q=${encodeURIComponent(query)}`,
                { headers: { Accept: "application/json" } },
            );
            const hits = response.ok ? ((await response.json()) as { lat?: string; lon?: string }[]) : [];
            const hit = hits[0];
            const lat = Number(hit?.lat);
            const lng = Number(hit?.lon);
            if (Number.isFinite(lat) && Number.isFinite(lng)) point = { lat, lng };
        } catch {
            point = null;
        }
    }

    cache.set(query, point);
    return point;
};
