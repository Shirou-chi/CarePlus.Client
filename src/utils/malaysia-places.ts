export type MalaysiaPlace = {
    name: string;
    lat: number;
    lng: number;
    zoom: number;
    rank: number;
    postcode: string;
};

// rank 0 surfaces first when several names share a prefix, so "Se" offers Segamat, Selangor, and Setapak.
const PLACES: MalaysiaPlace[] = [
    { name: "Segamat, Johor", lat: 2.5148, lng: 102.8158, zoom: 13, rank: 0, postcode: "85000" },
    { name: "Selangor", lat: 3.0738, lng: 101.5183, zoom: 9, rank: 0, postcode: "40000" },
    { name: "Setapak, Kuala Lumpur", lat: 3.1991, lng: 101.7246, zoom: 14, rank: 0, postcode: "53300" },
    { name: "Seberang Perai, Penang", lat: 5.365, lng: 100.456, zoom: 12, rank: 1, postcode: "13700" },
    { name: "Semenyih, Selangor", lat: 2.9513, lng: 101.843, zoom: 13, rank: 1, postcode: "43500" },
    { name: "Senai, Johor", lat: 1.604, lng: 103.653, zoom: 13, rank: 1, postcode: "81400" },
    { name: "Sentul, Kuala Lumpur", lat: 3.182, lng: 101.689, zoom: 14, rank: 1, postcode: "51000" },
    { name: "Sepang, Selangor", lat: 2.693, lng: 101.75, zoom: 12, rank: 1, postcode: "43900" },
    { name: "Seremban, Negeri Sembilan", lat: 2.7258, lng: 101.9378, zoom: 13, rank: 1, postcode: "70000" },
    { name: "Petaling Jaya, Selangor", lat: 3.1073, lng: 101.6067, zoom: 13, rank: 1, postcode: "46000" },
    { name: "Shah Alam, Selangor", lat: 3.0733, lng: 101.5185, zoom: 13, rank: 1, postcode: "40000" },
    { name: "Kuala Lumpur", lat: 3.139, lng: 101.6869, zoom: 12, rank: 1, postcode: "50000" },
    { name: "Klang, Selangor", lat: 3.0449, lng: 101.4456, zoom: 13, rank: 1, postcode: "41000" },
    { name: "Subang Jaya, Selangor", lat: 3.0565, lng: 101.5851, zoom: 13, rank: 1, postcode: "47500" },
    { name: "Johor Bahru, Johor", lat: 1.4927, lng: 103.7414, zoom: 12, rank: 1, postcode: "80000" },
    { name: "George Town, Penang", lat: 5.4141, lng: 100.3288, zoom: 13, rank: 1, postcode: "10000" },
    { name: "Ipoh, Perak", lat: 4.5975, lng: 101.0901, zoom: 13, rank: 1, postcode: "30000" },
    { name: "Melaka", lat: 2.1896, lng: 102.2501, zoom: 13, rank: 1, postcode: "75000" },
    { name: "Kota Bharu, Kelantan", lat: 6.1254, lng: 102.2381, zoom: 13, rank: 1, postcode: "15000" },
    { name: "Kuantan, Pahang", lat: 3.8077, lng: 103.326, zoom: 13, rank: 1, postcode: "25000" },
    { name: "Kuching, Sarawak", lat: 1.5533, lng: 110.3592, zoom: 12, rank: 1, postcode: "93000" },
    { name: "Miri, Sarawak", lat: 4.3995, lng: 113.9914, zoom: 12, rank: 1, postcode: "98000" },
    { name: "Kota Kinabalu, Sabah", lat: 5.9804, lng: 116.0735, zoom: 12, rank: 1, postcode: "88000" },
    { name: "Sandakan, Sabah", lat: 5.8394, lng: 118.1172, zoom: 12, rank: 1, postcode: "90000" },
    { name: "Labuan", lat: 5.2831, lng: 115.2308, zoom: 13, rank: 1, postcode: "87000" },
];

const DEFAULT_PLACE = PLACES.find((place) => place.name.startsWith("Setapak")) ?? PLACES[0];

export const searchPlaces = (query: string, limit = 6) => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return PLACES.filter((place) => place.name.toLowerCase().includes(q))
        .sort((a, b) => {
            const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
            const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
            return aStart - bStart || a.rank - b.rank || a.name.localeCompare(b.name);
        })
        .slice(0, limit);
};

export const placeFromAddress = (address: string) => {
    const q = address.trim().toLowerCase();
    if (!q) return null;
    return (
        PLACES.find((place) => place.name.toLowerCase() === q) ??
        PLACES.find((place) => q.includes(place.name.toLowerCase())) ??
        null
    );
};

const distanceKm = (lat: number, lng: number, place: MalaysiaPlace) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(place.lat - lat);
    const dLng = toRad(place.lng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(place.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(a));
};

export const nearestPlace = (lat: number, lng: number) => {
    let place = PLACES[0];
    let best = distanceKm(lat, lng, place);
    for (const candidate of PLACES) {
        const distance = distanceKm(lat, lng, candidate);
        if (distance < best) {
            place = candidate;
            best = distance;
        }
    }
    return { place, distanceKm: best };
};

export const labelForPoint = (lat: number, lng: number) => {
    const nearest = nearestPlace(lat, lng);
    if (nearest.distanceKm <= 12) return `${nearest.place.name}, ${nearest.place.postcode}`;
    return `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)}), ${nearest.place.postcode}`;
};

export const pinFromAddress = (address: string): MalaysiaPlace => placeFromAddress(address) ?? DEFAULT_PLACE;

const seNames = searchPlaces("Se").map((place) => place.name);
if (!seNames.includes("Segamat, Johor") || !seNames.includes("Selangor") || !seNames.includes("Setapak, Kuala Lumpur")) {
    throw new Error('searchPlaces("Se") must include Segamat, Selangor, and Setapak');
}

if (!labelForPoint(3.1991, 101.7246).includes("53300")) {
    throw new Error("A Setapak pin must include postal code 53300");
}
